'use client';
import { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { dict, type Lang } from '@/lib/i18n/dict';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const lang: Lang = useSyncExternalStore(() => () => {}, () => (document.documentElement.lang === 'en' ? 'en' : 'bn'), () => 'bn');
  useEffect(() => console.error(error), [error]);
  const t = dict[lang].err;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
      <p className="mt-2 text-zinc-400">{t.sub}</p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="rounded-lg bg-emerald-500 px-5 py-2.5 font-semibold text-black hover:bg-emerald-400">{t.retry}</button>
        <Link href="/" className="rounded-lg border border-white/15 px-5 py-2.5 font-semibold hover:bg-white/5">{t.home}</Link>
      </div>
    </div>
  );
}
