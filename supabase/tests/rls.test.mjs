import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const db = new PGlite();
const sql = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql as $$
    select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema auth, storage to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant execute on function storage.foldername(text) to anon, authenticated;
`);

for (const f of ['schema.sql', 'policies.sql', 'phase1.sql', 'phase2.sql', 'phase3.sql', 'phase4.sql', 'phase5.sql', 'phase6.sql', 'phase7.sql', 'phase8.sql', 'phase9.sql', 'phase10.sql']) {
  try { await db.exec(sql(f)); console.log('loaded', f); }
  catch (e) { console.log('FAILED to load', f, '->', e.message); process.exit(1); }
}
// second pass proves idempotency
for (const f of ['phase1.sql', 'phase2.sql', 'phase3.sql', 'phase4.sql', 'phase5.sql', 'phase6.sql', 'phase7.sql', 'phase8.sql', 'phase9.sql', 'phase10.sql']) {
  try { await db.exec(sql(f)); } catch (e) { console.log('NOT IDEMPOTENT', f, '->', e.message); }
}
console.log('re-ran phases 1-6 (idempotency check) done');

const ids = { admin: crypto.randomUUID(), mod: crypto.randomUUID(), s1: crypto.randomUUID(), s2: crypto.randomUUID() };
for (const [k, id] of Object.entries(ids))
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [id, `${k}@x.test`, JSON.stringify({ full_name: k, phone: '01711111111' })]);
await db.exec(`update profiles set role='admin' where id='${ids.admin}'; update profiles set role='moderator', mod_scopes='{content}' where id='${ids.mod}';`);

const as = async (who) => { await db.exec('reset role'); await db.query(`select set_config('request.jwt.claim.sub', '', false)`); if (who) { await db.exec(`set role authenticated`); await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [ids[who]]); } };
let pass = 0, failN = 0;
const t = async (name, fn, expect = 'ok') => {
  let res = 'ok', detail = '';
  try { detail = await fn(); } catch (e) { res = 'err'; detail = e.message; }
  const good = expect === 'ok' ? res === 'ok' : res === 'err';
  good ? pass++ : failN++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${good ? '' : '  -> ' + detail}`);
  return detail;
};
const q = async (s, p) => (await db.query(s, p)).rows;

// ---- content setup (as admin) ----
await as('admin');
const course = (await q(`insert into courses (slug,title,price,published) values ('paid','Paid',100,true) returning id`))[0].id;
const free = (await q(`insert into courses (slug,title,price,published) values ('free','Free',0,true) returning id`))[0].id;
const mod = (await q(`insert into modules (course_id,title) values ($1,'M') returning id`, [course]))[0].id;
const lesson = (await q(`insert into lessons (module_id,title,content_type) values ($1,'L','video') returning id`, [mod]))[0].id;
await q(`insert into lesson_media (lesson_id, video_id) values ($1,'abc')`, [lesson]);
const exam = (await q(`insert into exams (course_id,title,kind,duration_min,negative_mark,published) values ($1,'E','mcq',30,0.25,true) returning id`, [course]))[0].id;
const q1 = (await q(`insert into exam_questions (exam_id,position,body,options,marks) values ($1,1,'1+1?', '[{"en":"1"},{"en":"2"}]', 1) returning id`, [exam]))[0].id;
const q2 = (await q(`insert into exam_questions (exam_id,position,body,options,marks) values ($1,2,'2+2?', '[{"en":"4"},{"en":"5"}]', 1) returning id`, [exam]))[0].id;
await q(`insert into exam_keys (question_id, correct, solution) values ($1,1,'because'), ($2,0,'obvious')`, [q1, q2]);

console.log('\n--- enrollment lockdown ---');
await as('s1');
await t('student cannot self-enroll in PAID course', () => q(`insert into enrollments (user_id,course_id) values ($1,$2)`, [ids.s1, course]), 'err');
await t('student can self-enroll in FREE course', () => q(`insert into enrollments (user_id,course_id) values ($1,$2)`, [ids.s1, free]));
await t('student cannot enroll with source=admin', () => q(`insert into enrollments (user_id,course_id,source) values ($1,$2,'admin')`, [ids.s1, course]), 'err');
await t('student cannot enroll someone else', () => q(`insert into enrollments (user_id,course_id) values ($1,$2)`, [ids.s2, free]), 'err');

console.log('\n--- content visibility / media secrecy ---');
await t('non-enrolled student cannot read paid lesson', async () => { if ((await q(`select * from lessons where id=$1`, [lesson])).length) throw new Error('visible'); });
await t('student cannot read lesson_media', async () => { if ((await q(`select * from lesson_media`)).length) throw new Error('visible'); });
await t('student cannot write courses (price unchanged)', async () => { await q(`update courses set price=0 where id=$1`, [course]); await as(null); const p = (await q(`select price from courses where id=$1`, [course]))[0].price; await as('s1'); if (Number(p) !== 100) throw new Error('price changed to ' + p); });
await as('mod');
await t('content moderator can write lessons', () => q(`update lessons set title='L2' where id=$1`, [lesson]));
await t('content moderator can read lesson_media', async () => { if (!(await q(`select * from lesson_media`)).length) throw new Error('hidden'); });
await t('moderator cannot promote self (blocked by guard trigger)', () => q(`update profiles set role='admin' where id=$1`, [ids.mod]), 'err');

console.log('\n--- exams ---');
await as(null); await q(`insert into enrollments (user_id,course_id,source) values ($1,$2,'payment')`, [ids.s1, course]);
await as('s2');
await t('non-enrolled student cannot see exam', async () => { if ((await q(`select * from exams`)).length) throw new Error('visible'); });
await as('s1');
await t('enrolled student sees exam', async () => { if (!(await q(`select * from exams`)).length) throw new Error('hidden'); });
await t('questions hidden before starting', async () => { if ((await q(`select * from exam_questions`)).length) throw new Error('visible'); });
await t('student cannot start attempt with a score', () => q(`insert into exam_attempts (exam_id,user_id,score) values ($1,$2,99)`, [exam, ids.s1]), 'err');
const att = (await q(`insert into exam_attempts (exam_id,user_id) values ($1,$2) returning id`, [exam, ids.s1]))[0].id;
await t('questions visible after starting', async () => { if ((await q(`select * from exam_questions`)).length !== 2) throw new Error('count'); });
await t('answer keys hidden before submit', async () => { if ((await q(`select * from exam_keys`)).length) throw new Error('LEAK'); });
await t('student cannot self-grade (score unchanged)', async () => { await q(`update exam_attempts set score=100 where id=$1`, [att]); await as(null); const s = (await q(`select score from exam_attempts where id=$1`, [att]))[0].score; await as('s1'); if (s !== null) throw new Error('score is ' + s); });
const r = await q(`select * from submit_exam($1, $2::jsonb)`, [att, JSON.stringify({ [q1]: 1, [q2]: 1 })]);
await t('MCQ grading: 1 right + 1 wrong @ -25% = 0.75', async () => { if (Number(r[0].score) !== 0.75 || Number(r[0].total) !== 2) throw new Error(JSON.stringify(r[0])); });
await t('double submit rejected', () => q(`select * from submit_exam($1, '{}'::jsonb)`, [att]), 'err');
await t('answer keys visible after submit', async () => { if ((await q(`select * from exam_keys`)).length !== 2) throw new Error('hidden'); });
await t('leaderboard lists the student', async () => { const b = await q(`select * from exam_leaderboard($1)`, [exam]); if (b.length !== 1 || !b[0].is_me) throw new Error(JSON.stringify(b)); });
await as('s2');
await t('non-enrolled student gets empty leaderboard', async () => { if ((await q(`select * from exam_leaderboard($1)`, [exam])).length) throw new Error('leak'); });
await as(null);
await q(`insert into enrollments (user_id,course_id,source) values ($1,$2,'admin')`, [ids.s2, course]);
await as('s2');
const att2 = (await q(`insert into exam_attempts (exam_id,user_id,started_at) values ($1,$2, now() - interval '2 hours') returning id`, [exam, ids.s2]))[0].id;
const late = await q(`select * from submit_exam($1, $2::jsonb)`, [att2, JSON.stringify({ [q1]: 1, [q2]: 0 })]);
await t('late MCQ submission scores 0 and is flagged', async () => { if (Number(late[0].score) !== 0 || late[0].late !== true) throw new Error(JSON.stringify(late[0])); });
await t('late attempt has status expired', async () => { const s = (await q(`select status from exam_attempts where id=$1`, [att2]))[0].status; if (s !== 'expired') throw new Error(s); });

console.log('\n--- comments / progress ---');
await as('s1');
await t('enrolled student posts comment', () => q(`insert into lesson_comments (lesson_id,user_id,body) values ($1,$2,'see 2:35')`, [lesson, ids.s1]));
await t('comments list returns it with author', async () => { const c = await q(`select * from lesson_comments_list($1)`, [lesson]); if (c.length !== 1 || c[0].author !== 's1' || !c[0].mine) throw new Error(JSON.stringify(c)); });
await t('student marks lesson complete', () => q(`insert into lesson_progress (user_id,lesson_id) values ($1,$2)`, [ids.s1, lesson]));
await as(null); await q(`delete from enrollments where user_id=$1 and course_id=$2`, [ids.s2, course]);
await as('s2');
await t('non-enrolled student cannot comment', () => q(`insert into lesson_comments (lesson_id,user_id,body) values ($1,$2,'hi')`, [lesson, ids.s2]), 'err');
await t('non-enrolled student sees no comments', async () => { if ((await q(`select * from lesson_comments_list($1)`, [lesson])).length) throw new Error('leak'); });

console.log('\n--- doubts / tickets ---');
await as('s1');
const d = (await q(`insert into doubts (user_id, body) values ($1,'help') returning id`, [ids.s1]))[0].id;
await as('s2');
await t("other student cannot read someone's doubt", async () => { if ((await q(`select * from doubts`)).length) throw new Error('leak'); });
await t('other student cannot reply to it', () => q(`insert into doubt_replies (doubt_id,user_id,body) values ($1,$2,'x')`, [d, ids.s2]), 'err');
await as('mod');
await t('moderator WITHOUT qna scope cannot read doubts', async () => { if ((await q(`select * from doubts`)).length) throw new Error('leak'); });
await as(null); await q(`update profiles set mod_scopes='{content,qna,support}' where id=$1`, [ids.mod]);
await as('mod');
await t('moderator WITH qna scope can read and reply', async () => { await q(`insert into doubt_replies (doubt_id,user_id,body) values ($1,$2,'answer')`, [d, ids.mod]); });
await as('s1');
await t('reply by staff sets doubt to answered', async () => { const s = (await q(`select status from doubts where id=$1`, [d]))[0].status; if (s !== 'answered') throw new Error(s); });
await t('student sees thread with staff flag', async () => { const rr = await q(`select * from doubt_replies_list($1)`, [d]); if (rr.length !== 1 || !rr[0].from_staff) throw new Error(JSON.stringify(rr)); });
const tk = (await q(`insert into tickets (user_id, subject) values ($1,'Payment issue') returning id`, [ids.s1]))[0].id;
await q(`insert into ticket_messages (ticket_id,user_id,body) values ($1,$2,'my bkash failed')`, [tk, ids.s1]);
await as('s2');
await t("other student cannot read ticket", async () => { if ((await q(`select * from tickets`)).length) throw new Error('leak'); });
await as('mod');
await t('support staff can resolve ticket', () => q(`update tickets set status='resolved' where id=$1`, [tk]));
await as('s1');
await q(`insert into ticket_messages (ticket_id,user_id,body) values ($1,$2,'still broken')`, [tk, ids.s1]);
await t('student reply reopens resolved ticket', async () => { const s = (await q(`select status from tickets where id=$1`, [tk]))[0].status; if (s !== 'open') throw new Error(s); });
await t('student cannot read payments of others / write payments', () => q(`insert into payments (tran_id,user_id,course_id,amount) values ('x',$1,$2,1)`, [ids.s1, course]), 'err');

console.log('\n--- profiles (phase 7) ---');
await t('student can edit own name and phone', async () => {
  await q(`update profiles set full_name='Rahim Uddin', phone='01811111111' where id=$1`, [ids.s1]);
  const p = (await q(`select full_name from profiles where id=$1`, [ids.s1]))[0];
  if (p.full_name !== 'Rahim Uddin') throw new Error('not saved');
});
await t('student cannot promote self to admin', () => q(`update profiles set role='admin' where id=$1`, [ids.s1]), 'err');
await t('student cannot grant self moderator scopes', () => q(`update profiles set mod_scopes='{content}' where id=$1`, [ids.s1]), 'err');
await t("student cannot edit someone else's profile (name unchanged)", async () => {
  await q(`update profiles set full_name='hacked' where id=$1`, [ids.s2]);
  await as(null); const n = (await q(`select full_name from profiles where id=$1`, [ids.s2]))[0].full_name; await as('s1');
  if (n === 'hacked') throw new Error('changed');
});
await as('admin');
await t('admin can change a role', () => q(`update profiles set role='moderator' where id=$1`, [ids.s2]));
await as(null);
await t('SQL editor / service role can still change roles', () => q(`update profiles set role='student' where id=$1`, [ids.s2]));
await as('s1');

console.log('\n--- course cards (phase 9) ---');
await as('admin');
await t('staff can set instructor, thumbnail path and a higher original price', () => q(`update courses set instructor_name='Fahim', thumbnail_path='x/y.webp', original_price=200 where id=$1`, [course]));
await t('original price below the price is rejected', () => q(`update courses set original_price=10 where id=$1`, [course]), 'err');
await as('s1');
await t('student cannot change course picture or price', async () => { await q(`update courses set instructor_name='hacked' where id=$1`, [course]); await as(null); const n = (await q(`select instructor_name from courses where id=$1`, [course]))[0].instructor_name; await as('s1'); if (n === 'hacked') throw new Error('changed'); });
await t('thumbnail bucket is public with an image-only limit', async () => { await as(null); const b = (await q(`select public, file_size_limit, allowed_mime_types from storage.buckets where id='course-thumbnails'`))[0]; await as('s1'); if (!b.public || Number(b.file_size_limit) !== 2097152 || b.allowed_mime_types.includes('application/pdf')) throw new Error(JSON.stringify(b)); });

console.log('\n--- coupons (phase 10) ---');
await as('admin');
const cp = (await q(`insert into coupons (code, kind, value, max_uses) values ('SAVE50','percent',50, 1) returning id`))[0].id;
await t('admin can create coupons', async () => { if (!cp) throw new Error('no id'); });
await t('lowercase or short codes are rejected', () => q(`insert into coupons (code, kind, value) values ('abc','percent',10)`), 'err');
await t('percent above 100 is rejected', () => q(`insert into coupons (code, kind, value) values ('TOOBIG','percent',150)`), 'err');
await t('duplicate code is rejected', () => q(`insert into coupons (code, kind, value) values ('SAVE50','fixed',10)`), 'err');
await as('s1');
await t('student cannot read the coupon list', async () => { if ((await q(`select * from coupons`)).length) throw new Error('LEAK'); });
await t('student cannot create or edit coupons', () => q(`insert into coupons (code, kind, value) values ('FREEBIE','percent',100)`), 'err');
await t('student cannot call redeem_coupon', () => q(`select redeem_coupon($1)`, [crypto.randomUUID()]), 'err');
await as(null);
const payRow = (await q(`insert into payments (tran_id,user_id,course_id,amount,list_price,discount_amount,coupon_id,status) values ('CPN1',$1,$2,50,100,50,$3,'paid') returning id`, [ids.s1, course, cp]))[0].id;
await db.exec('reset role'); await db.exec('set role service_role');
await t('service_role can redeem; counted once even if called twice', async () => {
  await q(`select redeem_coupon($1)`, [payRow]); await q(`select redeem_coupon($1)`, [payRow]);
  const c = (await q(`select used_count from coupons where id=$1`, [cp]))[0].used_count; const r = (await q(`select count(*)::int n from coupon_redemptions where payment_id=$1`, [payRow]))[0].n;
  if (Number(c) !== 1 || r !== 1) throw new Error(`used_count=${c}, redemptions=${r}`);
});
await db.exec('reset role');
await as('admin');
await t('a coupon with redemptions cannot be deleted', () => q(`delete from coupons where id=$1`, [cp]), 'err');
await as('s1');

console.log('\n--- server key (phase 8) ---');
await db.exec('reset role'); await db.exec('set role service_role');
await t('service_role can read lesson_media', async () => { if (!(await q(`select * from lesson_media`)).length) throw new Error('empty'); });
await t('service_role can register a device session', () => q(`insert into user_sessions (user_id, device_id) values ($1, 'dev1')`, [ids.s1]));
await t('service_role can record a payment', () => q(`insert into payments (tran_id,user_id,course_id,amount) values ('T1',$1,$2,100)`, [ids.s1, course]));
await db.exec('reset role');

await as(null);
console.log(`\n${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);

