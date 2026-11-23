import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { connection } from 'next/server';
import { getT } from '@/lib/i18n/server';
import { setLang } from '@/lib/i18n/actions';
import HtmlLang from './HtmlLang';

async function logout() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

const link = 'rounded-md px-3 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100';

export default async function Navbar() {
  await connection();
  const { lang, t } = await getT();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#09090B]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
            <rect x="1" y="1" width="24" height="24" rx="7" className="fill-emerald-400/10 stroke-emerald-400/60" />
            <path d="M8 17V9l5 3.5L18 9v8" className="stroke-emerald-300" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-[family-name:var(--font-heading)] text-lg font-extrabold tracking-[-0.02em]">EduSite</span>
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium">
          <HtmlLang lang={lang} />
          <Link href="/" className={`hidden sm:block ${link}`}>{t.nav.home}</Link>
          <Link href="/courses" className={link}>{t.nav.courses}</Link>
          <form action={setLang.bind(null, lang === 'bn' ? 'en' : 'bn')}>
            <button className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-white/20 hover:text-zinc-100">{t.nav.switchTo}</button>
          </form>
          {user ? (
            <>
              <Link href="/dashboard" className={link}>{t.nav.dashboard}</Link>
              <form action={logout}>
                <button className="ml-2 rounded-full bg-zinc-100 px-4 py-1.5 text-zinc-950 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95">{t.nav.logout}</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="ml-2 rounded-full bg-zinc-100 px-4 py-1.5 text-zinc-950 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95">{t.nav.login}</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
