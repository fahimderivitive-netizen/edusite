import Link from 'next/link';
import { getT } from '@/lib/i18n/server';
import { YOUTUBE_URL } from '@/lib/youtube';

export default async function Footer() {
  const { t } = await getT();
  const links = [
    { href: '/terms', label: t.footer.terms },
    { href: '/privacy', label: t.footer.privacy },
    { href: '/refund', label: t.footer.refund },
    { href: '/support', label: t.footer.support },
  ];
  const linkCls = 'transition hover:text-zinc-200';
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-zinc-500 sm:flex-row">
        <span className="text-center sm:text-left">
          &copy; Quark of Education
          <span className="block text-xs italic text-zinc-600">Dedicated to excellence</span>
        </span>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {links.map((l) => <Link key={l.href} href={l.href} className={linkCls}>{l.label}</Link>)}
          <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>YouTube</a>
        </nav>
      </div>
    </footer>
  );
}
