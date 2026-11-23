import Link from 'next/link';
import { connection } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { card } from '@/components/admin/ui';
export const instant = false;

export default async function AdminHome() {
  await connection();
  const s = await requireStaff();
  const supabase = await createClient();
  const count = async (table: string, filter?: [string, string]) => {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    return (await q).count ?? 0;
  };
  const isAdmin = s.role === 'admin';
  const [courses, lessons, students, enrollments] = await Promise.all([
    count('courses'),
    count('lessons'),
    isAdmin ? count('profiles', ['role', 'student']) : 0,
    isAdmin ? count('enrollments') : 0,
  ]);
  const stats = [
    { label: 'Courses', value: courses, href: '/admin/courses' },
    { label: 'Lessons', value: lessons, href: '/admin/courses' },
    ...(isAdmin ? [{ label: 'Students', value: students, href: '/admin/users' }, { label: 'Enrollments', value: enrollments, href: '/admin/users' }] : []),
  ];
  return (
    <div>
      <h1 className="mb-6 text-3xl">Overview</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((x) => (
          <Link key={x.label} href={x.href} className={`${card} transition hover:border-white/20`}>
            <p className="text-3xl font-bold">{x.value}</p>
            <p className="mt-1 text-sm text-zinc-400">{x.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
