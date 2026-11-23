import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { replyTicket, updateTicket } from '@/app/engage/actions';
import { dict, type Lang } from '@/lib/i18n/dict';

type Msg = { id: string; body: string; created_at: string; author: string; from_staff: boolean };

export default async function TicketThread({ ticketId, lang, staff = false }: { ticketId: string; lang: Lang; staff?: boolean }) {
  const t = dict[lang].engage;
  const supabase = await createClient();
  const { data: tk } = await supabase.from('tickets').select('*').eq('id', ticketId).maybeSingle();
  if (!tk) notFound();
  const { data } = await supabase.rpc('ticket_thread', { p_ticket: ticketId });
  const label = { open: t.ticketOpen, in_progress: t.ticketProgress, resolved: t.ticketResolved }[tk.status as 'open' | 'in_progress' | 'resolved'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">{tk.subject}</h1>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">{label}</span>
      </div>
      {staff && (
        <form action={updateTicket} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#111113] p-3 text-sm">
          <input type="hidden" name="id" value={tk.id} />
          <select name="status" defaultValue={tk.status} className="rounded-lg border border-white/10 bg-[#09090B] px-2 py-1.5">
            <option value="open">open</option><option value="in_progress">in progress</option><option value="resolved">resolved</option>
          </select>
          <select name="assign" defaultValue="" className="rounded-lg border border-white/10 bg-[#09090B] px-2 py-1.5">
            <option value="">keep assignee</option><option value="me">assign to me</option><option value="none">unassign</option>
          </select>
          <button className="rounded-lg border border-white/10 px-3 py-1.5 text-zinc-300 hover:border-white/20">Save</button>
        </form>
      )}
      {((data ?? []) as Msg[]).map((m) => (
        <div key={m.id} className={`rounded-xl border p-4 ${m.from_staff ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-white/10 bg-[#111113]'}`}>
          <p className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-medium text-zinc-300">{m.author}</span>
            {m.from_staff && <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-emerald-300">{t.staff}</span>}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{m.body}</p>
        </div>
      ))}
      <form action={replyTicket} className="space-y-3 rounded-xl border border-white/10 bg-[#111113] p-4">
        <input type="hidden" name="ticket_id" value={tk.id} />
        <textarea name="body" required rows={3} maxLength={4000} placeholder={t.replyHere} className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm placeholder:text-zinc-600 focus:border-emerald-400/50 focus:outline-none" />
        <button className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95">{t.send}</button>
      </form>
    </div>
  );
}
