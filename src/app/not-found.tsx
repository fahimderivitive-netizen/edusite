import Link from 'next/link';
import { getT } from '@/lib/i18n/server';

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="font-heading text-6xl font-extrabold text-emerald-400">404</p>
      <h1 className="mt-4 font-heading text-2xl font-bold">{t.err.nfTitle}</h1>
      <p className="mt-2 text-zinc-400">{t.err.nfSub}</p>
      <Link href="/" className="mt-6 rounded-lg bg-emerald-500 px-5 py-2.5 font-semibold text-black hover:bg-emerald-400">{t.err.home}</Link>
    </div>
  );
}
