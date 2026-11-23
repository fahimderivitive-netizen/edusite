import { connection } from 'next/server';
import Link from 'next/link';
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import CourseCard from '@/components/course/CourseCard';
export const instant = false;

export default async function Home() {
  await connection();
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from('courses')
    .select('id, slug, title, description, price, category')
    .eq('published', true)
    .order('title')
    .limit(3);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(52,211,153,0.18),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:py-32">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <Sparkles size={14} /> New courses every month
          </span>
          <h1 className="mt-6 text-5xl sm:text-7xl">
            Learn the craft.<br />
            <span className="bg-gradient-to-r from-emerald-300 to-cyan-400 bg-clip-text text-transparent">Ship the skill.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Focused, high-quality courses from top instructors. Learn at your own pace, on any device.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95"
            >
              Browse Courses <ArrowRight size={16} />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-white/20 hover:bg-white/10 active:scale-95"
            >
              <PlayCircle size={16} /> Start for free
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl sm:text-3xl">Featured courses</h2>
          <Link href="/courses" className="hidden items-center gap-1 text-sm text-zinc-400 transition hover:text-emerald-400 sm:inline-flex">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {(courses ?? []).map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>
    </div>
  );
}
