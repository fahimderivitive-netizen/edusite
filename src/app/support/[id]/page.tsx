import Link from 'next/link';
import { connection } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getT } from '@/lib/i18n/server';
import TicketThread from '@/components/engage/TicketThread';
export const instant = false;

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requireUser();
  const { id } = await params;
  const { lang, t } = await getT();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/support" className="mb-6 inline-block text-sm text-emerald-400 hover:text-emerald-300">← {t.engage.support}</Link>
      <TicketThread ticketId={id} lang={lang} />
    </div>
  );
}
