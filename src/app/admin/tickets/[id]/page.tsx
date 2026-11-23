import Link from 'next/link';
import { connection } from 'next/server';
import { requireStaff } from '@/lib/auth';
import TicketThread from '@/components/engage/TicketThread';
export const instant = false;

export default async function AdminTicket({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requireStaff('support');
  const { id } = await params;
  return (
    <div className="max-w-3xl">
      <Link href="/admin/tickets" className="mb-6 inline-block text-sm text-emerald-400 hover:text-emerald-300">← Tickets</Link>
      <TicketThread ticketId={id} lang="en" staff />
    </div>
  );
}
