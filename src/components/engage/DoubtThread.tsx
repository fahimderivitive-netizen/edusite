/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signPaths } from '@/lib/media';
import { replyDoubt, setDoubtStatus } from '@/app/engage/actions';
import { dict, type Lang } from '@/lib/i18n/dict';
import DoubtComposer from './DoubtComposer';

type Reply = { id: string; body: string; image_path: string | null; audio_path: string | null; created_at: string; author: string; from_staff: boolean };

function Bubble({ who, staff, body, image, audio, label }: { who: string; staff: boolean; body: string; image?: string; audio?: string; label: string }) {
  return (
    <div className={`rounded-xl border p-4 ${staff ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-white/10 bg-[#111113]'}`}>
      <p className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
        <span className="font-medium text-zinc-300">{who}</span>
        {staff && <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-emerald-300">{label}</span>}
      </p>
      {body && <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{body}</p>}
      {image && <a href={image} target="_blank" rel="noreferrer"><img src={image} alt="" className="mt-3 max-h-80 rounded-lg border border-white/10" /></a>}
      {audio && <audio controls src={audio} className="mt-3 w-full max-w-sm" />}
    </div>
  );
}

export default async function DoubtThread({ doubtId, viewerId, lang, staff = false }: { doubtId: string; viewerId: string; lang: Lang; staff?: boolean }) {
  const t = dict[lang].engage;
  const supabase = await createClient();
  const { data: d } = await supabase.from('doubts').select('*').eq('id', doubtId).maybeSingle();
  if (!d) notFound();
  const [{ data: replies }, { data: asker }] = await Promise.all([
    supabase.rpc('doubt_replies_list', { p_doubt: doubtId }),
    supabase.from('profiles').select('full_name').eq('id', d.user_id).maybeSingle(),
  ]);
  const rs = (replies ?? []) as Reply[];
  const urls = await signPaths('doubt-media', [d.image_path, d.audio_path, ...rs.flatMap((r) => [r.image_path, r.audio_path])]);
  const u = (p: string | null) => (p ? urls.get(p) : undefined);
  const statusLabel = { open: t.open, answered: t.answered, closed: t.closed }[d.status as 'open' | 'answered' | 'closed'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">{statusLabel}</span>
        {staff && (
          <form action={setDoubtStatus} className="flex items-center gap-2">
            <input type="hidden" name="id" value={d.id} />
            <select name="status" defaultValue={d.status} className="rounded-lg border border-white/10 bg-[#09090B] px-2 py-1.5 text-sm">
              <option value="open">open</option><option value="answered">answered</option><option value="closed">closed</option>
            </select>
            <button className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:border-white/20">Save</button>
          </form>
        )}
      </div>
      <Bubble who={asker?.full_name ?? 'Student'} staff={false} body={d.body} image={u(d.image_path)} audio={u(d.audio_path)} label={t.staff} />
      {rs.map((r) => <Bubble key={r.id} who={r.author} staff={r.from_staff} body={r.body} image={u(r.image_path)} audio={u(r.audio_path)} label={t.staff} />)}
      {d.status !== 'closed' && (
        <DoubtComposer action={replyDoubt} userId={viewerId} hidden={{ doubt_id: d.id }} placeholder={t.replyHere} lang={lang} />
      )}
    </div>
  );
}
