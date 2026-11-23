import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { deleteExam, deleteQuestion, gradeAttempt, saveQuestion, updateExam } from '../actions';
import ConfirmButton from '@/components/admin/ConfirmButton';
import { Field, btn, btnDanger, btnGhost, card, input } from '@/components/admin/ui';
export const instant = false;

type Opt = { en: string; bn?: string | null };
type Q = { id: string; body: string; body_bn: string | null; options: Opt[] | null; marks: number; position: number };
type K = { question_id: string; correct: number | null; solution: string | null; solution_bn: string | null };

export default async function EditExam({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requireStaff('content');
  const { id } = await params;
  const supabase = await createClient();
  const { data: e } = await supabase.from('exams').select('*').eq('id', id).maybeSingle();
  if (!e) notFound();

  const [{ data: courses }, { data: qs }, { data: keys }, { data: stats }, { data: attempts }] = await Promise.all([
    supabase.from('courses').select('id, title').order('title'),
    supabase.from('exam_questions').select('*').eq('exam_id', id).order('position'),
    supabase.from('exam_keys').select('*'),
    supabase.rpc('exam_question_stats', { p_exam: id }),
    supabase.from('exam_attempts').select('id, user_id, status, score, total, late, answer_text, answer_path, feedback, submitted_at').eq('exam_id', id).neq('status', 'in_progress').order('submitted_at', { ascending: false }).limit(100),
  ]);
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', (attempts ?? []).map((a) => a.user_id));
  const keyOf = (qid: string) => (keys as K[] | null)?.find((k) => k.question_id === qid);
  const scored = (attempts ?? []).filter((a) => a.score !== null);
  const avg = scored.length ? scored.reduce((n, a) => n + Number(a.score), 0) / scored.length : 0;

  const signed = new Map<string, string>();
  for (const a of attempts ?? []) {
    if (a.answer_path) {
      const { data } = await supabase.storage.from('answer-uploads').createSignedUrl(a.answer_path, 300);
      if (data?.signedUrl) signed.set(a.id, data.signedUrl);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">{e.title}</h1>
        <form action={deleteExam}><input type="hidden" name="id" value={e.id} /><ConfirmButton className={btnDanger}>Delete exam</ConfirmButton></form>
      </div>

      <form action={updateExam} className={`${card} grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
        <input type="hidden" name="id" value={e.id} />
        <Field label="Course"><select name="course_id" defaultValue={e.course_id} className={input}>{(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></Field>
        <Field label="Title (English)"><input name="title" required defaultValue={e.title} className={input} /></Field>
        <Field label="Title (বাংলা)"><input name="title_bn" defaultValue={e.title_bn ?? ''} className={input} /></Field>
        <Field label="Type"><select name="kind" defaultValue={e.kind} className={input}><option value="mcq">MCQ</option><option value="written">Written</option></select></Field>
        <Field label="Duration (min)"><input name="duration_min" type="number" min="1" defaultValue={e.duration_min} className={input} /></Field>
        <Field label="Negative marking (0–1)"><input name="negative_mark" type="number" min="0" max="1" step="0.05" defaultValue={e.negative_mark} className={input} /></Field>
        <Field label="Instructions" className="sm:col-span-2"><input name="instructions" defaultValue={e.instructions ?? ''} className={input} /></Field>
        <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" name="published" defaultChecked={e.published} className="h-4 w-4 accent-emerald-400" /> Published</label>
        <div className="sm:col-span-2 lg:col-span-4"><button className={btn}>Save exam</button></div>
      </form>

      <section className="space-y-3">
        <h2 className="text-xl">Questions <span className="text-sm text-zinc-500">(Markdown, LaTeX with $…$ and $$…$$)</span></h2>
        {(qs as Q[] | null ?? []).map((q, i) => {
          const st = (stats as { question_id: string; answered: number; correct_count: number }[] | null)?.find((s) => s.question_id === q.id);
          return (
            <details key={q.id} className="rounded-xl border border-white/10 bg-[#111113]">
              <summary className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm">
                <span className="text-zinc-500">{i + 1}.</span>
                <span className="flex-1 truncate">{q.body}</span>
                {e.kind === 'mcq' && st && Number(st.answered) > 0 && <span className="text-xs text-zinc-400">{Math.round((Number(st.correct_count) / Number(st.answered)) * 100)}% correct ({st.answered})</span>}
              </summary>
              <div className="space-y-3 border-t border-white/10 p-4">
                <QuestionForm examId={id} kind={e.kind} q={q} k={keyOf(q.id)} />
                <form action={deleteQuestion}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="exam_id" value={id} /><ConfirmButton className={btnDanger}>Delete</ConfirmButton></form>
              </div>
            </details>
          );
        })}
        <details className="rounded-xl border border-dashed border-white/10">
          <summary className="cursor-pointer px-4 py-3 text-sm text-emerald-400">+ Add question</summary>
          <div className="border-t border-white/10 p-4"><QuestionForm examId={id} kind={e.kind} nextPos={(qs?.length ?? 0) + 1} /></div>
        </details>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl">Submissions <span className="text-sm text-zinc-500">· {attempts?.length ?? 0} submitted · average {avg.toFixed(1)}</span></h2>
        {(attempts ?? []).map((a) => (
          <div key={a.id} className={`${card} space-y-3`}>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium">{profiles?.find((p) => p.id === a.user_id)?.full_name ?? a.user_id.slice(0, 8)}</span>
              <span className="text-zinc-500">{a.status}{a.late && ' · late'}</span>
              <span className="ml-auto text-zinc-300">{a.score !== null ? `${a.score} / ${a.total}` : 'ungraded'}</span>
            </div>
            {e.kind === 'written' && (
              <>
                {a.answer_text && <p className="whitespace-pre-wrap rounded-lg bg-[#09090B] p-3 text-sm text-zinc-300">{a.answer_text}</p>}
                {signed.get(a.id) && <a href={signed.get(a.id)} target="_blank" rel="noreferrer" className="text-sm text-emerald-400 underline">Open uploaded file</a>}
                <form action={gradeAttempt} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={a.id} /><input type="hidden" name="exam_id" value={id} />
                  <Field label={`Score (out of ${a.total})`}><input name="score" type="number" step="0.5" min="0" defaultValue={a.score ?? ''} required className={`${input} w-28`} /></Field>
                  <Field label="Feedback" className="min-w-64 flex-1"><input name="feedback" defaultValue={a.feedback ?? ''} className={input} /></Field>
                  <button className={btnGhost}>Save grade</button>
                </form>
              </>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

function QuestionForm({ examId, kind, q, k, nextPos = 0 }: { examId: string; kind: string; q?: Q; k?: K; nextPos?: number }) {
  return (
    <form action={saveQuestion} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={q?.id ?? ''} />
      <input type="hidden" name="exam_id" value={examId} />
      <Field label="Question (English)"><textarea name="body" required rows={3} defaultValue={q?.body} className={input} /></Field>
      <Field label="প্রশ্ন (বাংলা)"><textarea name="body_bn" rows={3} defaultValue={q?.body_bn ?? ''} className={input} /></Field>
      {kind === 'mcq' && (
        <>
          <Field label="Options (English, one per line)"><textarea name="options_en" rows={4} defaultValue={q?.options?.map((o) => o.en).join('\n')} className={input} /></Field>
          <Field label="অপশন (বাংলা, প্রতি লাইনে একটি, একই ক্রমে)"><textarea name="options_bn" rows={4} defaultValue={q?.options?.map((o) => o.bn ?? '').join('\n')} className={input} /></Field>
          <Field label="Correct option number (1 = first)"><input name="correct" type="number" min="1" defaultValue={k?.correct != null ? k.correct + 1 : 1} className={input} /></Field>
        </>
      )}
      <Field label="Marks"><input name="marks" type="number" step="0.5" min="0.5" defaultValue={q?.marks ?? 1} className={input} /></Field>
      <Field label="Order"><input name="position" type="number" min="0" defaultValue={q?.position ?? nextPos} className={input} /></Field>
      <Field label={kind === 'written' ? 'Model solution (English)' : 'Solution (English)'}><textarea name="solution" rows={3} defaultValue={k?.solution ?? ''} className={input} /></Field>
      <Field label="সমাধান (বাংলা)"><textarea name="solution_bn" rows={3} defaultValue={k?.solution_bn ?? ''} className={input} /></Field>
      <div className="sm:col-span-2"><button className={btn}>{q ? 'Save question' : 'Add question'}</button></div>
    </form>
  );
}
