import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  async function logout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <main className="mx-auto mt-24 max-w-sm p-4">
      <h1 className="mb-2 text-2xl font-bold">Dashboard</h1>
      <p className="mb-4">{user.email}</p>
      <form action={logout}>
        <button className="rounded bg-black px-4 py-2 text-white">Log out</button>
      </form>
    </main>
  )
}
