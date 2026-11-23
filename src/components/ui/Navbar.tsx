import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { connection } from 'next/server';

async function logout() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

const link = 'rounded-md px-3 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100';

export default async function Navbar() {
  await connection();
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
          <Link href="/" className={`hidden sm:block ${link}`}>Home</Link>
          <Link href="/courses" className={link}>Courses</Link>
          {user ? (
            <>
              <Link href="/dashboard" className={link}>Dashboard</Link>
              <form action={logout}>
                <button className="ml-2 rounded-full bg-zinc-100 px-4 py-1.5 text-zinc-950 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95">Logout</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="ml-2 rounded-full bg-zinc-100 px-4 py-1.5 text-zinc-950 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95">Login/Signup</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
