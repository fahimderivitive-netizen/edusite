import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { pick } from '@/lib/i18n/dict';
import { nowMs } from '@/lib/time';
import Md from '@/components/Md';
import ExamRunner from '@/components/exam/ExamRunner';
export const instant = false;

type Opt = { en: string; bn?: string | null };

export default async function TakeExam({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const user = await requireUser();
  const { id } = await params;
  const { lang } = await getT();
  const supabase = await createClient();

  const { data: exam } = await supabase.from('exams').select('id, title, title_bn, kind, duration_min').eq('id', id).maybeSingle();
  if (!exam) notFound();
  const { data: attempt } = await supabase.from('exam_attempts').select('id, status, started_at').eq('exam_id', id).eq('user_id', user.id).maybeSingle();
  if (!attempt) redirect(`/exams/${id}`);
  if (attempt.status !== 'in_progress') redirect(`/exams/${id}/result`);
  const { data: questions } = await supabase.from('exam_questions').select('id, body, body_bn, options').eq('exam_id', id).order('position');

  const deadline = new Date(attempt.started_at).getTime() + exam.duration_min * 60_000;
  const remainingSec = Math.max(0, Math.floor((deadline - nowMs()) / 1000));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl">{pick(lang, exam.title, exam.title_bn)}</h1>
      <ExamRunner
        attemptId={attempt.id}
        examId={exam.id}
        userId={user.id}
        kind={exam.kind}
        lang={lang}
        remainingSec={remainingSec}
        questions={(questions ?? []).map((q) => ({
          id: q.id,
          body: <Md>{pick(lang, q.body, q.body_bn)}</Md>,
          options: ((q.options ?? []) as Opt[]).map((o, i) => <Md key={i}>{pick(lang, o.en, o.bn)}</Md>),
        }))}
      />
    </div>
  );
}
