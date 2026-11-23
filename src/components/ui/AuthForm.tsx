'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { dict, type Lang } from '@/lib/i18n/dict'

export default function AuthForm({ mode, lang }: { mode: 'login' | 'signup'; lang: Lang }) {
  const t = dict[lang].auth
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const router = useRouter()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const f = new FormData(e.currentTarget)
    const email = f.get('email') as string
    const password = f.get('password') as string
    const phone = ((f.get('phone') as string | null) ?? '').trim()
    const supabase = createClient()
    const { data, error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { phone } } })
    if (error) return setError(error.message)
    if (mode === 'signup' && !data.session) return setInfo(t.checkEmail)
    router.push('/dashboard')
    router.refresh()
  }

  const login = mode === 'login'
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_0%,rgba(52,211,153,0.12),transparent_70%)]" />
      <div className="relative mx-auto max-w-md px-4 py-16 sm:py-24">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8">
          <h1 className="text-2xl">{login ? t.welcome : t.create}</h1>
          <p className="mb-6 mt-1 text-sm text-zinc-400">{login ? t.loginSub : t.signupSub}</p>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <input name="email" type="email" placeholder={t.email} required className="rounded-lg border border-white/10 bg-[#111113] px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20" />
            {!login && <input name="phone" type="tel" placeholder={t.phone} required pattern="(\+?88)?01[3-9][0-9]{8}" className="rounded-lg border border-white/10 bg-[#111113] px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20" />}
            <input name="password" type="password" placeholder={t.password} minLength={6} required className="rounded-lg border border-white/10 bg-[#111113] px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20" />
            {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            {info && <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">{info}</p>}
            <button className="rounded-full bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-[0.98]">{login ? t.login : t.signup}</button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-400">
            <Link href={login ? '/signup' : '/login'} className="font-medium text-emerald-400 hover:text-emerald-300">
              {login ? t.needAccount : t.haveAccount}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
