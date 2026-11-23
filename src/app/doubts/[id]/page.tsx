import Link from 'next/link';
import { connection } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getT } from '@/lib/i18n/server';
import DoubtThread from '@/components/engage/DoubtThread';
export const instant = false;

export default async function DoubtPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const user = await requireUser();
  const { id } = await params;
  const { lang, t } = await getT();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/doubts" className="mb-6 inline-block text-sm text-emerald-400 hover:text-emerald-300">← {t.engage.doubts}</Link>
      <DoubtThread doubtId={id} viewerId={user.id} lang={lang} />
    </div>
  );
}
