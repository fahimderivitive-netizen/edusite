import Link from 'next/link';
import { BookOpen, CheckCircle2, ChevronDown, Lock, PlayCircle } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurriculum } from '@/lib/curriculum';
import { connection } from 'next/server';
export const instant = false
export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, description, price')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (!course) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const [modules, enrollment] = await Promise.all([
    getCurriculum(supabase, course.id),
    user
      ? supabase.from('enrollments').select('id').eq('course_id', course.id).eq('user_id', user.id).maybeSingle()
      : null,
  ]);
  const enrolled = !!enrollment?.data;

  async function enroll() {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    const { error } = await supabase.from('enrollments').insert({ user_id: user.id, course_id: course!.id });
    if (error && error.code !== '23505') throw new Error(error.message);
    redirect('/dashboard');
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_-10%,rgba(52,211,153,0.16),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_360px] lg:py-20">
          <div>
            <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
              <Link href="/courses" className="transition hover:text-zinc-100">Courses</Link>
              <span>/</span>
              <span className="text-zinc-300">{course.title}</span>
            </nav>
            <h1 className="text-4xl sm:text-5xl">{course.title}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-400">{course.description}</p>
            <div className="mt-6 flex items-center gap-4 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-1.5"><BookOpen size={16} /> {modules.length} modules</span>
              <span className="inline-flex items-center gap-1.5"><PlayCircle size={16} /> {modules.reduce((n, m) => n + m.lessons.length, 0)} lessons</span>
            </div>
          </div>

          <div className="h-fit rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <p className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-[-0.02em]">
              {Number(course.price) === 0 ? 'Free' : `$${course.price}`}
            </p>
            <div className="mt-5">
              {enrolled ? (
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-300">
                  <CheckCircle2 size={16} /> Enrolled
                </span>
              ) : (
                <form action={enroll}>
                  <button className="w-full rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 shadow-[0_0_24px_rgba(52,211,153,0.3)] transition hover:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B] active:scale-[0.98]">
                    Enroll Now
                  </button>
                </form>
              )}
            </div>
            <p className="mt-4 text-center text-xs text-zinc-500">Full lifetime access</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl">Curriculum</h2>
        <div className="space-y-4">
          {modules.map((m, i) => (
            <details key={m.id} open={i === 0} className="group overflow-hidden rounded-xl border border-white/10 bg-[#111113]">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#18181B] text-sm font-semibold text-zinc-300">{i + 1}</span>
                <span className="flex-1 font-medium">{m.title}</span>
                <span className="text-xs text-zinc-500">{m.lessons.length} lessons</span>
                <ChevronDown size={16} className="text-zinc-500 transition group-open:rotate-180" />
              </summary>
              <div className="divide-y divide-white/5 border-t border-white/10">
                {m.lessons.map((l) => {
                  const open = enrolled || l.is_free_preview;
                  const row = (
                    <>
                      {open ? <PlayCircle size={18} className="shrink-0 text-emerald-400" /> : <Lock size={16} className="shrink-0 text-zinc-600" />}
                      <span className={`flex-1 text-sm ${open ? 'text-zinc-100' : 'text-zinc-500'}`}>{l.title}</span>
                      {l.is_free_preview && (
                        <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.25)]">Free Preview</span>
                      )}
                    </>
                  );
                  return open ? (
                    <Link key={l.id} href={`/courses/${slug}/lessons/${l.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.04]">{row}</Link>
                  ) : (
                    <div key={l.id} className="flex items-center gap-3 px-5 py-3.5">{row}</div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
