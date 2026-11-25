import { connection } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { updateProfile } from './actions';
export const instant = false;

export default async function Profile({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await connection();
  const user = await requireUser();
  const { saved } = await searchParams;
  const { t } = await getT();
  const supabase = await createClient();
  const { data: p } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle();
  const field = 'w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20';

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-6 text-3xl">{t.profile.title}</h1>
      <form action={updateProfile} className="space-y-4 rounded-xl border border-white/10 bg-[#111113] p-6">
        <label className="block text-sm text-zinc-400">{t.profile.email}
          <input value={user.email ?? ''} disabled className={`${field} mt-1.5 opacity-60`} />
        </label>
        <label className="block text-sm text-zinc-400">{t.profile.fullName}
          <input name="full_name" required maxLength={80} defaultValue={p?.full_name ?? ''} className={`${field} mt-1.5`} />
        </label>
        <label className="block text-sm text-zinc-400">{t.profile.phone}
          <input name="phone" type="tel" pattern="((\+?88)?01[3-9][0-9]{8})?" defaultValue={p?.phone ?? ''} className={`${field} mt-1.5`} />
        </label>
        {saved && <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">{t.profile.saved}</p>}
        <button className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95">{t.profile.save}</button>
      </form>
    </div>
  );
}
