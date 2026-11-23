import Link from 'next/link';
import { connection } from 'next/server';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { fmt, num, pick } from '@/lib/i18n/dict';
export const instant = false;

export default async function Exams() {
  await connection();
  const user = await requireUser();
  const { lang, t } = await getT();
  const supabase = await createClient();
  const [{ data: exams }, { data: attempts }] = await Promise.all([
    supabase.from('exams').select('id, title, title_bn, kind, duration_min, courses(title, title_bn)').eq('published', true).order('created_at', { ascending: false }),
    supabase.from('exam_attempts').select('exam_id, status, score, total').eq('user_id', user.id),
  ]);
  const label = (s?: string) => (!s ? t.exam.statusNew : s === 'in_progress' ? t.exam.statusRun : s === 'graded' ? t.exam.statusGraded : t.exam.statusDone);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl sm:text-4xl">{t.exam.title}</h1>
      {exams?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {exams.map((e) => {
            const a = attempts?.find((x) => x.exam_id === e.id);
            const c = Array.isArray(e.courses) ? e.courses[0] : e.courses;
            return (
              <Link key={e.id} href={`/exams/${e.id}`} className="group rounded-xl border border-white/10 bg-[#111113] p-5 transition hover:-translate-y-0.5 hover:border-white/20">
                <div className="mb-3 flex items-center justify-between text-xs text-zinc-400">
                  <span className="rounded-full border border-white/10 px-2.5 py-0.5">{e.kind === 'mcq' ? t.exam.mcq : t.exam.written}</span>
                  <span>{fmt(t.exam.min, e.duration_min, lang)}</span>
                </div>
                <h2 className="text-lg">{pick(lang, e.title, e.title_bn)}</h2>
                {c && <p className="mt-1 text-sm text-zinc-500">{pick(lang, c.title, c.title_bn)}</p>}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className={a?.status === 'graded' || a?.status === 'submitted' ? 'text-emerald-400' : 'text-zinc-400'}>
                    {label(a?.status)}{a?.score != null && ` · ${num(a.score, lang)}/${num(a.total ?? 0, lang)}`}
                  </span>
                  <ArrowRight size={16} className="text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-emerald-400" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-white/10 bg-[#111113] py-16 text-center">
          <ClipboardList size={22} className="mb-3 text-zinc-500" />
          <p className="max-w-sm text-zinc-400">{t.exam.none}</p>
        </div>
      )}
    </div>
  );
}
