import Link from 'next/link';
import { connection } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
export const instant = false;

const tabs = ['open', 'in_progress', 'resolved', 'all'];

export default async function AdminTickets({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await connection();
  const me = await requireStaff('support');
  const { status = 'open' } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from('tickets').select('id, user_id, subject, status, assignee_id, updated_at').order('updated_at', { ascending: false }).limit(100);
  if (status !== 'all') q = q.eq('status', status);
  const { data: tickets } = await q;
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', (tickets ?? []).map((t) => t.user_id));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Support tickets</h1>
      <div className="flex flex-wrap gap-2">
        {tabs.map((s) => (
          <Link key={s} href={`/admin/tickets?status=${s}`} className={`rounded-full border px-4 py-1.5 text-sm ${s === status ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-white/10 text-zinc-400 hover:text-zinc-100'}`}>{s.replace('_', ' ')}</Link>
        ))}
      </div>
      <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-[#111113] text-sm">
        {(tickets ?? []).map((k) => (
          <Link key={k.id} href={`/admin/tickets/${k.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03]">
            <span className="w-40 shrink-0 truncate text-zinc-400">{profiles?.find((p) => p.id === k.user_id)?.full_name ?? k.user_id.slice(0, 8)}</span>
            <span className="flex-1 truncate">{k.subject}</span>
            {k.assignee_id === me.id && <span className="text-xs text-emerald-400">mine</span>}
            <span className="text-xs text-zinc-500">{new Date(k.updated_at).toLocaleDateString('en-GB')}</span>
          </Link>
        ))}
        {!tickets?.length && <p className="px-4 py-6 text-zinc-500">Nothing here.</p>}
      </div>
    </div>
  );
}
