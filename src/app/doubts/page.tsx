import Link from 'next/link';
import { connection } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { createDoubt } from '@/app/engage/actions';
import DoubtComposer from '@/components/engage/DoubtComposer';
export const instant = false;

export default async function Doubts({ searchParams }: { searchParams: Promise<{ lesson?: string }> }) {
  await connection();
  const user = await requireUser();
  const { lesson } = await searchParams;
  const { lang, t } = await getT();
  const supabase = await createClient();
  const { data: doubts } = await supabase.from('doubts').select('id, body, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
  const label = { open: t.engage.open, answered: t.engage.answered, closed: t.engage.closed } as Record<string, string>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl">{t.engage.askDoubt}</h1>
      <DoubtComposer action={createDoubt} userId={user.id} hidden={lesson ? { lesson_id: lesson } : {}} lang={lang} />
      <h2 className="mb-3 mt-10 text-xl">{t.engage.doubts}</h2>
      {doubts?.length ? (
        <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-[#111113] text-sm">
          {doubts.map((d) => (
            <Link key={d.id} href={`/doubts/${d.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03]">
              <span className="flex-1 truncate text-zinc-200">{d.body || '📎'}</span>
              <span className="text-xs text-zinc-400">{label[d.status]}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">{t.engage.noDoubts}</p>
      )}
    </div>
  );
}
