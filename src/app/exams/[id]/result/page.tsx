import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { num, pick } from '@/lib/i18n/dict';
import Md from '@/components/Md';
export const instant = false;

type Opt = { en: string; bn?: string | null };

export default async function ExamResult({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const user = await requireUser();
  const { id } = await params;
  const { lang, t } = await getT();
  const supabase = await createClient();

  const { data: exam } = await supabase.from('exams').select('id, title, title_bn, kind').eq('id', id).maybeSingle();
  if (!exam) notFound();
  const { data: attempt } = await supabase.from('exam_attempts').select('*').eq('exam_id', id).eq('user_id', user.id).maybeSingle();
  if (!attempt) redirect(`/exams/${id}`);
  if (attempt.status === 'in_progress') redirect(`/exams/${id}/take`);

  const [{ data: questions }, { data: keys }, { data: answers }, { data: board }] = await Promise.all([
    supabase.from('exam_questions').select('id, body, body_bn, options, marks').eq('exam_id', id).order('position'),
    supabase.from('exam_keys').select('question_id, correct, solution, solution_bn'),
    supabase.from('exam_answers').select('question_id, choice').eq('attempt_id', attempt.id),
    supabase.rpc('exam_leaderboard', { p_exam: id }),
  ]);
  const keyOf = (qid: string) => keys?.find((k) => k.question_id === qid);
  const choiceOf = (qid: string) => answers?.find((a) => a.question_id === qid)?.choice ?? null;
  const me = (board ?? []).find((b: { is_me: boolean }) => b.is_me);

  let fileUrl: string | null = null;
  if (attempt.answer_path) fileUrl = (await supabase.storage.from('answer-uploads').createSignedUrl(attempt.answer_path, 300)).data?.signedUrl ?? null;

  const graded = attempt.score !== null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl">{pick(lang, exam.title, exam.title_bn)}</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#111113] p-5">
          <p className="text-sm text-zinc-400">{t.exam.score}</p>
          <p className="mt-1 text-3xl font-bold text-emerald-400">{graded ? `${num(attempt.score, lang)} / ${num(attempt.total ?? 0, lang)}` : '—'}</p>
        </div>
        {me && (
          <div className="rounded-xl border border-white/10 bg-[#111113] p-5">
            <p className="text-sm text-zinc-400">{t.exam.rank}</p>
            <p className="mt-1 text-3xl font-bold">#{num(me.rank, lang)}</p>
          </div>
        )}
      </div>
      {attempt.status === 'expired' && <p className="mb-6 rounded-lg bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{t.exam.expired}</p>}
      {attempt.late && attempt.status !== 'expired' && <p className="mb-6 rounded-lg bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{t.exam.late}</p>}
      {exam.kind === 'written' && !graded && <p className="mb-6 rounded-lg bg-white/5 px-4 py-3 text-sm text-zinc-300">{t.exam.awaiting}</p>}

      {exam.kind === 'written' && (
        <section className="mb-8 space-y-4 rounded-xl border border-white/10 bg-[#111113] p-5">
          <h2 className="text-lg">{t.exam.yourAnswer}</h2>
          {attempt.answer_text && <p className="whitespace-pre-wrap text-zinc-300">{attempt.answer_text}</p>}
          {fileUrl && <a href={fileUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-400 underline">{attempt.answer_path?.split('/').pop()}</a>}
          {attempt.feedback && (
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="mb-1 text-xs uppercase tracking-wider text-emerald-300">{t.exam.feedback}</p>
              <p className="whitespace-pre-wrap text-sm text-zinc-200">{attempt.feedback}</p>
            </div>
          )}
        </section>
      )}

      <div className="space-y-5">
        {(questions ?? []).map((q, i) => {
          const k = keyOf(q.id);
          const chosen = choiceOf(q.id);
          const sol = pick(lang, k?.solution, k?.solution_bn);
          return (
            <div key={q.id} className="rounded-xl border border-white/10 bg-[#111113] p-5">
              <div className="mb-3 flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#18181B] text-sm font-semibold">{num(i + 1, lang)}</span>
                <div className="min-w-0 flex-1"><Md>{pick(lang, q.body, q.body_bn)}</Md></div>
              </div>
              {exam.kind === 'mcq' && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {((q.options ?? []) as Opt[]).map((o, oi) => {
                    const right = k?.correct === oi;
                    const wrong = chosen === oi && !right;
                    return (
                      <div key={oi} className={`rounded-lg border px-4 py-2.5 text-sm ${right ? 'border-emerald-400/50 bg-emerald-400/10' : wrong ? 'border-red-400/50 bg-red-400/10' : 'border-white/10'}`}>
                        <Md>{pick(lang, o.en, o.bn)}</Md>
                      </div>
                    );
                  })}
                </div>
              )}
              {exam.kind === 'mcq' && chosen === null && <p className="mt-2 text-xs text-zinc-500">{t.exam.skipped}</p>}
              {sol && (
                <div className="mt-4 border-t border-white/10 pt-3 text-sm text-zinc-300">
                  <p className="mb-1 text-xs uppercase tracking-wider text-zinc-500">{t.exam.solution}</p>
                  <Md>{sol}</Md>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {board && board.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl">{t.exam.leaderboard}</h2>
          <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-[#111113] text-sm">
            {board.slice(0, 10).map((b: { rank: number; name: string; score: number; total: number; is_me: boolean }, i: number) => (
              <div key={i} className={`flex items-center gap-4 px-4 py-3 ${b.is_me ? 'bg-emerald-400/10' : ''}`}>
                <span className="w-8 text-zinc-500">#{num(b.rank, lang)}</span>
                <span className="flex-1">{b.name}{b.is_me && ` (${t.exam.you})`}</span>
                <span className="font-medium">{num(b.score, lang)} / {num(b.total, lang)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      <Link href="/exams" className="mt-8 inline-block text-sm text-emerald-400 hover:text-emerald-300">← {t.exam.title}</Link>
    </div>
  );
}
