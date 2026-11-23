import Link from 'next/link';
import { connection } from 'next/server';
import { requireStaff } from '@/lib/auth';
import DoubtThread from '@/components/engage/DoubtThread';
export const instant = false;

export default async function AdminDoubt({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const s = await requireStaff('qna');
  const { id } = await params;
  return (
    <div className="max-w-3xl">
      <Link href="/admin/doubts" className="mb-6 inline-block text-sm text-emerald-400 hover:text-emerald-300">← Doubts</Link>
      <DoubtThread doubtId={id} viewerId={s.id} lang="en" staff />
    </div>
  );
}
