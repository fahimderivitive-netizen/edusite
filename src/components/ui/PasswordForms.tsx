'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { dict, type Lang } from '@/lib/i18n/dict';

const field = 'rounded-lg border border-white/10 bg-[#111113] px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20';
const submit = 'rounded-full bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-white active:scale-[0.98]';

function Shell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_0%,rgba(92,225,230,0.12),transparent_70%)]" />
      <div className="relative mx-auto max-w-md px-4 py-16 sm:py-24">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8">
          <h1 className="text-2xl">{title}</h1>
          {sub && <p className="mb-6 mt-1 text-sm text-zinc-400">{sub}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ForgotForm({ lang }: { lang: Lang }) {
  const t = dict[lang].auth;
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    const email = new FormData(e.currentTarget).get('email') as string;
    // Same message whether or not the account exists, so the form cannot be used to probe for emails.
    await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` });
    setSent(true);
    setSending(false);
  }
  return (
    <Shell title={t.forgotTitle} sub={t.forgotSub}>
      {sent ? (
        <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">{t.linkSent}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input name="email" type="email" placeholder={t.email} required className={field} />
          <button disabled={sending} className={`${submit} disabled:opacity-60`}>{sending ? t.sending : t.sendLink}</button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link href="/login" className="text-emerald-400 hover:text-emerald-300">{t.backToLogin}</Link></p>
    </Shell>
  );
}

export function ResetForm({ lang }: { lang: Lang }) {
  const t = dict[lang].auth;
  const router = useRouter();
  const [error, setError] = useState('');
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const password = new FormData(e.currentTarget).get('password') as string;
    const { error: err } = await createClient().auth.updateUser({ password });
    if (err) return setError(err.message.toLowerCase().includes('session') ? t.resetNeedLink : err.message);
    router.push('/dashboard');
    router.refresh();
  }
  return (
    <Shell title={t.resetTitle}>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        <input name="password" type="password" placeholder={t.newPassword} minLength={6} required className={field} />
        {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <button className={submit}>{t.savePassword}</button>
      </form>
    </Shell>
  );
}
