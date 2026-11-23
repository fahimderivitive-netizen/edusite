import Link from 'next/link';
import { connection } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { createTicket } from '@/app/engage/actions';
export const instant = false;

export default async function Support() {
  await connection();
  const user = await requireUser();
  const { t } = await getT();
  const supabase = await createClient();
  const { data: tickets } = await supabase.from('tickets').select('id, subject, status, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false });
  const label = { open: t.engage.ticketOpen, in_progress: t.engage.ticketProgress, resolved: t.engage.ticketResolved } as Record<string, string>;
  const field = 'w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-400/50 focus:outline-none';

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl">{t.engage.support}</h1>
      <form action={createTicket} className="space-y-3 rounded-xl border border-white/10 bg-[#111113] p-4">
        <h2 className="text-lg">{t.engage.newTicket}</h2>
        <input name="subject" required minLength={3} maxLength={200} placeholder={t.engage.subject} className={field} />
        <textarea name="message" required rows={4} maxLength={4000} placeholder={t.engage.message} className={field} />
        <button className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95">{t.engage.createTicket}</button>
      </form>
      <div className="mt-8">
        {tickets?.length ? (
          <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-[#111113] text-sm">
            {tickets.map((k) => (
              <Link key={k.id} href={`/support/${k.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03]">
                <span className="flex-1 truncate text-zinc-200">{k.subject}</span>
                <span className={`text-xs ${k.status === 'resolved' ? 'text-emerald-400' : 'text-zinc-400'}`}>{label[k.status]}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">{t.engage.noTickets}</p>
        )}
      </div>
    </div>
  );
}
