import { connection } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, hasServiceKey } from '@/lib/supabase/admin';
import { enrollUser, revokeEnrollment, setRole } from '../actions';
import { Field, btn, btnDanger, btnGhost, card, input } from '@/components/admin/ui';
export const instant = false;

export default async function AdminUsers() {
  await connection();
  const me = await requireAdmin();
  const supabase = await createClient();

  const [{ data: profiles }, { data: courses }, { data: enrollments }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, mod_scopes').order('role'),
    supabase.from('courses').select('id, title').order('title'),
    supabase.from('enrollments').select('id, user_id, course_id, source, created_at').order('created_at', { ascending: false }).limit(30),
  ]);

  const emails = new Map<string, string>();
  if (hasServiceKey()) {
    const { data } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 });
    data?.users.forEach((u) => emails.set(u.id, u.email ?? ''));
  }
  const label = (id: string, name?: string | null) => emails.get(id) || name || id.slice(0, 8);
  const courseTitle = (id: string) => courses?.find((c) => c.id === id)?.title ?? id.slice(0, 8);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl">Users</h1>
      {!hasServiceKey() && (
        <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Set SUPABASE_SERVICE_ROLE_KEY on the server to show user emails here.
        </p>
      )}

      <form action={enrollUser} className={`${card} flex flex-wrap items-end gap-3`}>
        <Field label="Enroll user">
          <select name="user_id" required className={input}>
            {(profiles ?? []).map((p) => <option key={p.id} value={p.id}>{label(p.id, p.full_name)}</option>)}
          </select>
        </Field>
        <Field label="in course">
          <select name="course_id" required className={input}>
            {(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </Field>
        <button className={btn}>Enroll</button>
      </form>

      <div className="space-y-3">
        {(profiles ?? []).map((p) => (
          <form key={p.id} action={setRole} className={`${card} flex flex-wrap items-center gap-4`}>
            <input type="hidden" name="user_id" value={p.id} />
            <div className="min-w-48 flex-1">
              <p className="font-medium">{label(p.id, p.full_name)}</p>
              {p.full_name && <p className="text-xs text-zinc-500">{p.full_name}</p>}
            </div>
            <select name="role" defaultValue={p.role} disabled={p.id === me.id} className={`${input} w-36`}>
              <option value="student">student</option>
              <option value="moderator">moderator</option>
              <option value="admin">admin</option>
            </select>
            <div className="flex gap-3 text-xs text-zinc-300">
              {(['content', 'qna', 'support'] as const).map((s) => (
                <label key={s} className="flex items-center gap-1.5">
                  <input type="checkbox" name="scopes" value={s} defaultChecked={p.mod_scopes?.includes(s)} className="accent-emerald-400" /> {s}
                </label>
              ))}
            </div>
            {p.id === me.id ? <span className="text-xs text-zinc-500">you</span> : <button className={btnGhost}>Save</button>}
          </form>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-xl">Recent enrollments</h2>
        <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-[#111113] text-sm">
          {(enrollments ?? []).map((e) => (
            <form key={e.id} action={revokeEnrollment} className="flex items-center gap-4 px-4 py-3">
              <input type="hidden" name="id" value={e.id} />
              <span className="flex-1 text-zinc-200">{label(e.user_id, profiles?.find((p) => p.id === e.user_id)?.full_name)}</span>
              <span className="flex-1 text-zinc-400">{courseTitle(e.course_id)}</span>
              <span className="text-xs text-zinc-500">{e.source}</span>
              <button className={btnDanger}>Revoke</button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
