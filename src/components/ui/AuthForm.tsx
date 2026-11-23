'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const router = useRouter()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const f = new FormData(e.currentTarget)
    const email = f.get('email') as string
    const password = f.get('password') as string
    const supabase = createClient()
    const { data, error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    if (error) return setError(error.message)
    if (mode === 'signup' && !data.session) return setInfo('Check your email to confirm your account.')
    router.push('/dashboard')
    router.refresh()
  }

  const login = mode === 'login'
  return (
    <main className="mx-auto mt-24 max-w-sm p-4">
      <h1 className="mb-4 text-2xl font-bold">{login ? 'Log in' : 'Sign up'}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="email" type="email" placeholder="Email" required className="rounded border p-2" />
        <input name="password" type="password" placeholder="Password" minLength={6} required className="rounded border p-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-600">{info}</p>}
        <button className="rounded bg-black p-2 text-white">{login ? 'Log in' : 'Sign up'}</button>
      </form>
      <p className="mt-4 text-sm">
        <Link href={login ? '/signup' : '/login'} className="underline">
          {login ? 'Need an account? Sign up' : 'Have an account? Log in'}
        </Link>
      </p>
    </main>
  )
}
