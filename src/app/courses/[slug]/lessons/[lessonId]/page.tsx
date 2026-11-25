import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import Comments from '@/components/engage/Comments';
import { toggleComplete } from '@/app/engage/actions';
import { createClient } from '@/lib/supabase/server';
import { getCurriculum } from '@/lib/curriculum';
import { connection } from 'next/server';
import { getT } from '@/lib/i18n/server';
import LessonMedia from '@/components/lesson/LessonMedia';
import Md from '@/components/Md';
import { fmt, pick } from '@/lib/i18n/dict';
export const instant = false

export default async function LessonPage({

  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
    await connection();
  const { slug, lessonId } = await params;
  const { lang, t } = await getT();
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, title_bn')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (!course) notFound();

  const modules = await getCurriculum(supabase, course.id);
  const flat = modules.flatMap((m) => m.lessons);
  const index = flat.findIndex((l) => l.id === lessonId);
  if (index < 0) notFound();

  // RLS returns the row only for free previews or enrolled users.
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, title_bn, content_md')
    .eq('id', lessonId)
    .maybeSingle();
  const { data: { user } } = await supabase.auth.getUser();
  const phone = user ? (await supabase.from('profiles').select('phone').eq('id', user.id).maybeSingle()).data?.phone : null;
  const mark = user ? [user.email, user.id.slice(0, 8), phone].filter(Boolean).join(' · ') : '';
  const { data: doneRows } = user ? await supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id) : { data: [] };
  const done = new Set((doneRows ?? []).map((r) => r.lesson_id));

  const prev = flat[index - 1];
  const next = flat[index + 1];
  const courseTitle = pick(lang, course.title, course.title_bn);

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <div className="flex flex-col lg:flex-row">
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-8">
          <nav className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
            <Link href="/courses" className="transition hover:text-zinc-100">{t.nav.courses}</Link>
            <span>/</span>
            <Link href={`/courses/${slug}`} className="truncate text-zinc-300 transition hover:text-zinc-100">{courseTitle}</Link>
          </nav>

          {!lesson ? (
            <div className="rounded-2xl border border-white/10 bg-[#111113] p-10 text-center sm:p-16">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#18181B]">
                <Lock size={18} className="text-zinc-400" />
              </div>
              <h1 className="text-2xl">{pick(lang, flat[index].title, flat[index].title_bn)}</h1>
              <p className="mx-auto mb-6 mt-2 max-w-md text-zinc-400">{t.lesson.locked}</p>
              <Link href={`/courses/${slug}`} className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-white active:scale-95">
                <ArrowLeft size={16} /> {t.lesson.back}
              </Link>
            </div>
          ) : (
            <>
              {user ? (
                <LessonMedia key={lesson.id} lessonId={lesson.id} mark={mark} lang={lang} />
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-[#111113] text-center">
                  <p className="text-zinc-400">{t.lesson.loginToWatch}</p>
                  <Link href="/login" className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-white active:scale-95">{t.lesson.loginBtn}</Link>
                </div>
              )}

              <div className="mt-6 rounded-xl border border-white/10 bg-[#111113] p-6">
                <h1 className="text-2xl sm:text-3xl">{pick(lang, lesson.title, lesson.title_bn)}</h1>
                {lesson.content_md && (
                  <Md className="mt-4 leading-relaxed text-zinc-400">{lesson.content_md}</Md>
                )}
              </div>

              {user && (
                <form action={toggleComplete} className="mt-4 flex flex-wrap items-center gap-3">
                  <input type="hidden" name="lesson_id" value={lesson.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <button className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95 ${done.has(lesson.id) ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-white/10 text-zinc-300 hover:border-white/20'}`}>
                    <CheckCircle2 size={16} /> {done.has(lesson.id) ? t.engage.done : t.engage.complete}
                  </button>
                  <Link href={`/doubts?lesson=${lesson.id}`} className="text-sm text-emerald-400 hover:text-emerald-300">{t.engage.askDoubt}</Link>
                </form>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                {prev ? (
                  <Link href={`/courses/${slug}/lessons/${prev.id}`} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#111113] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-zinc-100 active:scale-95">
                    <ArrowLeft size={16} /> {t.lesson.prev}
                  </Link>
                ) : <span />}
                {next && (
                  <Link href={`/courses/${slug}/lessons/${next.id}`} className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-[0_0_20px_rgba(92,225,230,0.25)] transition hover:bg-emerald-300 active:scale-95">
                    {t.lesson.next} <ArrowRight size={16} />
                  </Link>
                )}
              </div>
              {user && <Comments lessonId={lesson.id} slug={slug} lang={lang} />}
            </>
          )}
        </div>

        <aside className="w-full border-t border-white/10 bg-[#111113] lg:w-96 lg:shrink-0 lg:border-l lg:border-t-0">
          <div className="lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
            <div className="border-b border-white/10 p-5">
              <h2 className="text-base leading-snug">{courseTitle}</h2>
              <p className="mt-1 text-xs text-zinc-500">{fmt(t.lesson.total, flat.length, lang)}</p>
            </div>
            <div className="divide-y divide-white/5">
              {modules.map((m, mi) => (
                <div key={m.id}>
                  <h3 className="bg-[#18181B] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">{mi + 1}. {pick(lang, m.title, m.title_bn)}</h3>
                  <ul>
                    {m.lessons.map((l, li) => {
                      const active = l.id === lessonId;
                      const locked = !l.is_free_preview && !lesson && active;
                      return (
                        <li key={l.id}>
                          <Link
                            href={`/courses/${slug}/lessons/${l.id}`}
                            className={`flex items-center gap-3 border-l-2 px-5 py-3 text-sm transition ${
                              active
                                ? 'border-emerald-400 bg-emerald-400/10 font-medium text-emerald-300'
                                : 'border-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
                            }`}
                          >
                            <span className="w-5 shrink-0 text-xs tabular-nums text-zinc-500">{li + 1}</span>
                            <span className="flex-1">{pick(lang, l.title, l.title_bn)}</span>
                            {locked ? <Lock size={16} className="shrink-0" /> : done.has(l.id) ? <CheckCircle2 size={16} className="shrink-0 text-emerald-400" /> : <PlayCircle size={16} className="shrink-0" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
