import { createClient } from '@/lib/supabase/server';
import { deleteComment } from '@/app/engage/actions';
import { dict, type Lang } from '@/lib/i18n/dict';
import CommentForm from './CommentForm';
import TimestampText from './TimestampText';

type C = { id: string; parent_id: string | null; body: string; created_at: string; author: string; from_staff: boolean; mine: boolean };

export default async function Comments({ lessonId, slug, lang }: { lessonId: string; slug: string; lang: Lang }) {
  const t = dict[lang].engage;
  const supabase = await createClient();
  const { data } = await supabase.rpc('lesson_comments_list', { p_lesson: lessonId });
  const all = (data ?? []) as C[];
  const top = all.filter((c) => !c.parent_id).reverse();

  const Item = ({ c, reply }: { c: C; reply?: boolean }) => (
    <div className={reply ? 'ml-8 mt-3 border-l border-white/10 pl-4' : ''}>
      <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
        <span className="font-medium text-zinc-300">{c.author}</span>
        {c.from_staff && <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-emerald-300">{t.staff}</span>}
        {c.mine && (
          <form action={deleteComment} className="ml-auto">
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="lesson_id" value={lessonId} />
            <input type="hidden" name="slug" value={slug} />
            <button className="hover:text-red-300">{t.del}</button>
          </form>
        )}
      </div>
      <TimestampText text={c.body} />
    </div>
  );

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-xl">{t.comments}</h2>
      <CommentForm lessonId={lessonId} slug={slug} lang={lang} />
      <div className="mt-6 space-y-5">
        {top.length === 0 && <p className="text-sm text-zinc-500">{t.noComments}</p>}
        {top.map((c) => (
          <div key={c.id} className="rounded-xl border border-white/10 bg-[#111113] p-4">
            <Item c={c} />
            {all.filter((r) => r.parent_id === c.id).map((r) => <Item key={r.id} c={r} reply />)}
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">{t.reply}</summary>
              <div className="mt-2"><CommentForm lessonId={lessonId} slug={slug} parentId={c.id} lang={lang} /></div>
            </details>
          </div>
        ))}
      </div>
    </section>
  );
}
