import Link from 'next/link';
import { connection } from 'next/server';
import { requireStaff } from '@/lib/auth';
export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const s = await requireStaff();
  const nav = [
    { href: '/admin', label: 'Overview', show: true },
    { href: '/admin/courses', label: 'Courses', show: s.scopes.includes('content') },
    { href: '/admin/exams', label: 'Exams', show: s.scopes.includes('content') },
    { href: '/admin/doubts', label: 'Doubts', show: s.scopes.includes('qna') },
    { href: '/admin/tickets', label: 'Tickets', show: s.scopes.includes('support') },
    { href: '/admin/users', label: 'Users', show: s.role === 'admin' },
    { href: '/admin/payments', label: 'Payments', show: s.role === 'admin' },
    { href: '/admin/coupons', label: 'Coupons', show: s.role === 'admin' },
  ].filter((n) => n.show);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
      <aside className="lg:w-52 lg:shrink-0">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {s.role === 'admin' ? 'Admin' : 'Moderator'} · {s.email}
        </p>
        <nav className="flex flex-wrap gap-1 lg:flex-col">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
