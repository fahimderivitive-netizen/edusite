'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { submitExam } from '@/app/exams/actions';
import { dict, type Lang } from '@/lib/i18n/dict';

export type RunnerQuestion = { id: string; body: React.ReactNode; options: React.ReactNode[] };

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function ExamRunner({ attemptId, examId, userId, kind, questions, remainingSec, lang }: {
  attemptId: string; examId: string; userId: string; kind: 'mcq' | 'written';
  questions: RunnerQuestion[]; remainingSec: number; lang: Lang;
}) {
  const t = dict[lang].exam;
  const [left, setLeft] = useState(remainingSec);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const [sure, setSure] = useState(false);
  const sent = useRef(false);
  const sendRef = useRef<() => void>(() => {});
  const leftRef = useRef(remainingSec);

  // Counts down and auto-submits the latest answers when time runs out.
  useEffect(() => {
    const id = setInterval(() => {
      leftRef.current -= 1;
      setLeft(Math.max(0, leftRef.current));
      if (leftRef.current <= 0) {
        clearInterval(id);
        sendRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function send() {
    if (sent.current) return;
    if (file && (file.size > 10 * 1024 * 1024 || !/^(image\/|application\/pdf)/.test(file.type))) return setError(t.fileTooBig);
    sent.current = true;
    setError('');
    start(async () => {
      try {
        let path: string | null = null;
        if (file) {
          const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          path = `${userId}/${attemptId}/${safe}`;
          const { error: upErr } = await createClient().storage.from('answer-uploads').upload(path, file, { upsert: true });
          if (upErr) throw new Error(upErr.message);
        }
        await submitExam({ attemptId, examId, answers, text, path });
      } catch (e) {
        if (e instanceof Error && e.message.includes('NEXT_REDIRECT')) throw e;
        sent.current = false;
        setError(e instanceof Error ? e.message : 'Error');
      }
    });
  }

  useEffect(() => {
    sendRef.current = send;
  });

  return (
    <div>
      <div className="sticky top-16 z-40 -mx-4 mb-6 flex items-center justify-between border-b border-white/10 bg-[#09090B]/90 px-4 py-3 backdrop-blur-md">
        <span className="text-sm text-zinc-400">{t.timeLeft}</span>
        <span className={`font-mono text-xl font-semibold tabular-nums ${left < 60 ? 'text-red-400' : 'text-emerald-400'}`}>{clock(left)}</span>
        {sure ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-zinc-300 sm:inline">{t.confirm}</span>
            <button
              disabled={pending}
              onClick={send}
              className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95 disabled:opacity-50"
            >
              {t.submit}
            </button>
            <button onClick={() => setSure(false)} aria-label="Cancel" className="px-2 text-zinc-400 hover:text-zinc-100">✕</button>
          </div>
        ) : (
          <button
            disabled={pending}
            onClick={() => setSure(true)}
            className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-white active:scale-95 disabled:opacity-50"
          >
            {t.submit}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-white/10 bg-[#111113] p-5">
            <div className="mb-4 flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#18181B] text-sm font-semibold">{i + 1}</span>
              <div className="min-w-0 flex-1">{q.body}</div>
            </div>
            {kind === 'mcq' && (
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((o, oi) => (
                  <label key={oi} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition ${answers[q.id] === oi ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-white/10 hover:border-white/20'}`}>
                    <input type="radio" name={q.id} checked={answers[q.id] === oi} onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))} className="mt-1 accent-emerald-400" />
                    <span className="min-w-0 flex-1">{o}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        {kind === 'written' && (
          <div className="space-y-4 rounded-xl border border-white/10 bg-[#111113] p-5">
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder={t.answer} className="w-full rounded-lg border border-white/10 bg-[#09090B] p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-400/50 focus:outline-none" />
            <label className="block text-sm text-zinc-400">
              {t.upload}
              <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm" />
            </label>
          </div>
        )}
        {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      </div>
    </div>
  );
}
