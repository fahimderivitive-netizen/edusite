import { connection } from 'next/server';
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { CourseCover } from '@/components/course/CourseCard'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  await connection();
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, courses(slug, title, description)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl">Dashboard</h1>
      <p className="mb-10 mt-2 text-zinc-400">{user.email}</p>
      <h2 className="mb-4 text-xl">My Courses</h2>
      {enrollments?.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => {
            const c = Array.isArray(e.courses) ? e.courses[0] : e.courses
            if (!c) return null
            return (
              <Link
                key={e.id}
                href={`/courses/${c.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111113] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
              >
                <CourseCover category={null} className="h-28" />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-2 text-lg">{c.title}</h3>
                  <p className="mb-5 line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-400">{c.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                    Continue <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-white/10 bg-[#111113] py-16 text-center">
          <BookOpen size={22} className="mb-3 text-zinc-500" />
          <p className="font-medium">You have no enrollments yet</p>
          <Link href="/courses" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300">Browse courses <ArrowRight size={16} /></Link>
        </div>
      )}
    </div>
  )
}
