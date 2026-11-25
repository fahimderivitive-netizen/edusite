import { connection } from 'next/server'
import Link from 'next/link'
import { ArrowRight, BookOpen, ClipboardList, HelpCircle, LifeBuoy } from 'lucide-react'
import { CourseThumb } from '@/components/course/CourseCard'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n/server'
import { fmt, num, pick } from '@/lib/i18n/dict'
export const instant = false

export default async function Dashboard() {
  await connection()
  const { lang, t } = await getT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, course_id, courses(slug, title, title_bn, description, description_bn, category, thumbnail_path)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const courseIds = (enrollments ?? []).map((e) => e.course_id)
  const { data: mods } = await supabase.from('modules').select('id, course_id').in('course_id', courseIds)
  const { data: lessons } = await supabase.from('lesson_outline').select('id, module_id').in('module_id', (mods ?? []).map((m) => m.id))
  const [{ data: done }, { data: scores }, { count: openDoubts }, { count: openTickets }] = await Promise.all([
    supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id),
    supabase.from('exam_attempts').select('exam_id, score, total, status, exams(title, title_bn)').eq('user_id', user.id).neq('status', 'in_progress').order('submitted_at', { ascending: false }).limit(5),
    supabase.from('doubts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'closed'),
    supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'resolved'),
  ])
  const doneSet = new Set((done ?? []).map((d) => d.lesson_id))
  const progress = (courseId: string) => {
    const ids = new Set((mods ?? []).filter((m) => m.course_id === courseId).map((m) => m.id))
    const ls = (lessons ?? []).filter((l) => ids.has(l.module_id))
    return { total: ls.length, completed: ls.filter((l) => doneSet.has(l.id)).length }
  }

  const tile = 'flex items-center gap-3 rounded-xl border border-white/10 bg-[#111113] p-4 transition hover:border-white/20'
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl">{t.dash.title}</h1>
      <p className="mb-8 mt-2 text-zinc-400">{user.email}</p>

      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <Link href="/doubts" className={tile}><HelpCircle size={20} className="text-emerald-400" /><span className="flex-1 text-sm">{t.engage.askDoubt}</span><span className="text-xs text-zinc-500">{fmt(t.engage.openDoubts, openDoubts ?? 0, lang)}</span></Link>
        <Link href="/support" className={tile}><LifeBuoy size={20} className="text-emerald-400" /><span className="flex-1 text-sm">{t.engage.support}</span><span className="text-xs text-zinc-500">{fmt(t.engage.openTickets, openTickets ?? 0, lang)}</span></Link>
        <Link href="/exams" className={tile}><ClipboardList size={20} className="text-emerald-400" /><span className="flex-1 text-sm">{t.exam.title}</span><ArrowRight size={16} className="text-zinc-500" /></Link>
      </div>

      <h2 className="mb-4 text-xl">{t.dash.myCourses}</h2>
      {enrollments?.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => {
            const c = Array.isArray(e.courses) ? e.courses[0] : e.courses
            if (!c) return null
            const p = progress(e.course_id)
            const pct = p.total ? Math.round((p.completed / p.total) * 100) : 0
            return (
              <Link
                key={e.id}
                href={`/courses/${c.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111113] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
              >
                <div className="aspect-video overflow-hidden bg-zinc-900"><div className="h-full w-full transition duration-500 group-hover:scale-105"><CourseThumb course={c} /></div></div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-2 text-lg">{pick(lang, c.title, c.title_bn)}</h3>
                  <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-400">{pick(lang, c.description, c.description_bn)}</p>
                  <div className="mb-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} /></div>
                    <p className="mt-1.5 text-xs text-zinc-500">{num(p.completed, lang)}/{num(p.total, lang)} · {num(pct, lang)}%</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                    {t.dash.cont} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-white/10 bg-[#111113] py-16 text-center">
          <BookOpen size={22} className="mb-3 text-zinc-500" />
          <p className="font-medium">{t.dash.emptyTitle}</p>
          <Link href="/courses" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300">{t.dash.browse} <ArrowRight size={16} /></Link>
        </div>
      )}

      <h2 className="mb-4 mt-12 text-xl">{t.engage.recentScores}</h2>
      {scores?.length ? (
        <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-[#111113] text-sm">
          {scores.map((s) => {
            const ex = Array.isArray(s.exams) ? s.exams[0] : s.exams
            return (
              <Link key={s.exam_id} href={`/exams/${s.exam_id}/result`} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03]">
                <span className="flex-1">{ex ? pick(lang, ex.title, ex.title_bn) : ''}</span>
                <span className="font-medium text-emerald-400">{s.score !== null ? `${num(s.score, lang)} / ${num(s.total ?? 0, lang)}` : '—'}</span>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">{t.engage.noScores}</p>
      )}
    </div>
  )
}
