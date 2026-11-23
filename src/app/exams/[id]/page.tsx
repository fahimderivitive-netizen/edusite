import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { fmt, pick } from '@/lib/i18n/dict';
import { startExam } from '../actions';
export const instant = false;

export default async function ExamIntro({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const user = await requireUser();
  const { id } = await params;
  const { lang, t } = await getT();
  const supabase = await createClient();
  const { data: exam } = await supabase.from('exams').select('id, title, title_bn, kind, duration_min, negative_mark, instructions').eq('id', id).maybeSingle();
  if (!exam) notFound();
  const { data: attempt } = await supabase.from('exam_attempts').select('status').eq('exam_id', id).eq('user_id', user.id).maybeSingle();
  if (attempt && attempt.status !== 'in_progress') redirect(`/exams/${id}/result`);
  const { count } = await supabase.from('exam_questions').select('id', { count: 'exact', head: true }).eq('exam_id', id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
        <p className="mb-2 text-xs uppercase tracking-wider text-emerald-400">{exam.kind === 'mcq' ? t.exam.mcq : t.exam.written}</p>
        <h1 className="text-3xl">{pick(lang, exam.title, exam.title_bn)}</h1>
        <div className="mt-4 flex gap-4 text-sm text-zinc-400">
          <span>{fmt(t.exam.min, exam.duration_min, lang)}</span>
          <span>{fmt(t.exam.questions, count ?? 0, lang)}</span>
        </div>
        {exam.instructions && <p className="mt-6 whitespace-pre-wrap text-zinc-300">{exam.instructions}</p>}
        {Number(exam.negative_mark) > 0 && <p className="mt-4 text-sm text-amber-200">{fmt(t.exam.negative, Math.round(Number(exam.negative_mark) * 100), lang)}</p>}
        <p className="mt-4 text-sm text-zinc-500">{t.exam.oneAttempt}</p>
        <form action={startExam} className="mt-8">
          <input type="hidden" name="exam_id" value={exam.id} />
          <button className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-[0_0_24px_rgba(52,211,153,0.3)] transition hover:bg-emerald-300 active:scale-95">
            {attempt ? t.exam.resume : t.exam.start}
          </button>
        </form>
      </div>
    </div>
  );
}
