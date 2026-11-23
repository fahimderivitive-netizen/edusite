import Link from 'next/link';
import { connection } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
export const instant = false;

const tabs = ['open', 'answered', 'closed', 'all'];

export default async function AdminDoubts({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await connection();
  await requireStaff('qna');
  const { status = 'open' } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from('doubts').select('id, user_id, body, status, created_at, image_path, audio_path').order('created_at', { ascending: true }).limit(100);
  if (status !== 'all') q = q.eq('status', status);
  const { data: doubts } = await q;
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', (doubts ?? []).map((d) => d.user_id));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Doubts</h1>
      <div className="flex gap-2">
        {tabs.map((s) => (
          <Link key={s} href={`/admin/doubts?status=${s}`} className={`rounded-full border px-4 py-1.5 text-sm capitalize ${s === status ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-white/10 text-zinc-400 hover:text-zinc-100'}`}>{s}</Link>
        ))}
      </div>
      <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-[#111113] text-sm">
        {(doubts ?? []).map((d) => (
          <Link key={d.id} href={`/admin/doubts/${d.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03]">
            <span className="w-40 shrink-0 truncate text-zinc-400">{profiles?.find((p) => p.id === d.user_id)?.full_name ?? d.user_id.slice(0, 8)}</span>
            <span className="flex-1 truncate">{d.body || (d.audio_path ? '🎤 voice note' : '📷 photo')}</span>
            <span className="text-xs text-zinc-500">{new Date(d.created_at).toLocaleDateString('en-GB')}</span>
          </Link>
        ))}
        {!doubts?.length && <p className="px-4 py-6 text-zinc-500">Nothing here.</p>}
      </div>
    </div>
  );
}
