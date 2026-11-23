import Link from 'next/link';
import { connection } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createExam } from './actions';
import { Field, btn, card, input } from '@/components/admin/ui';
export const instant = false;

export default async function AdminExams() {
  await connection();
  await requireStaff('content');
  const supabase = await createClient();
  const [{ data: exams }, { data: courses }] = await Promise.all([
    supabase.from('exams').select('id, title, kind, published, duration_min, courses(title)').order('created_at', { ascending: false }),
    supabase.from('courses').select('id, title').order('title'),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl">Exams</h1>
      <form action={createExam} className={`${card} grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
        <Field label="Course"><select name="course_id" required className={input}>{(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></Field>
        <Field label="Title (English)"><input name="title" required className={input} /></Field>
        <Field label="Title (বাংলা)"><input name="title_bn" className={input} /></Field>
        <Field label="Type"><select name="kind" className={input}><option value="mcq">MCQ (auto-graded)</option><option value="written">Written (manual)</option></select></Field>
        <Field label="Duration (minutes)"><input name="duration_min" type="number" min="1" defaultValue="30" className={input} /></Field>
        <Field label="Negative marking (0–1, e.g. 0.25)"><input name="negative_mark" type="number" min="0" max="1" step="0.05" defaultValue="0" className={input} /></Field>
        <Field label="Instructions" className="sm:col-span-2"><input name="instructions" className={input} /></Field>
        <div className="sm:col-span-2 lg:col-span-4"><button className={btn}>Create exam</button></div>
      </form>
      <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-[#111113] text-sm">
        {(exams ?? []).map((e) => {
          const c = Array.isArray(e.courses) ? e.courses[0] : e.courses;
          return (
            <Link key={e.id} href={`/admin/exams/${e.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03]">
              <span className="flex-1 font-medium">{e.title}</span>
              <span className="text-zinc-500">{c?.title}</span>
              <span className="text-xs uppercase text-zinc-400">{e.kind}</span>
              <span className={e.published ? 'text-emerald-400' : 'text-zinc-500'}>{e.published ? 'Published' : 'Draft'}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
