import { connection } from 'next/server';
import Link from 'next/link'
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
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
      <p className="mb-6 text-gray-600">{user.email}</p>
      <h2 className="mb-4 text-xl font-semibold">My Courses</h2>
      {enrollments?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((e) => {
            const c = Array.isArray(e.courses) ? e.courses[0] : e.courses
            if (!c) return null
            return (
              <div key={e.id} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">{c.title}</h3>
                <p className="text-gray-600 mb-4">{c.description}</p>
                <Link href={`/courses/${c.slug}`} className="text-blue-600 hover:underline">Continue</Link>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-gray-600">
          You have no enrollments yet. <Link href="/courses" className="text-blue-600 hover:underline">Browse courses</Link>
        </p>
      )}
    </main>
  )
}
