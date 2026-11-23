'use client';
import { useEffect, useRef, useState } from 'react';
import { postComment } from '@/app/engage/actions';
import { dict, type Lang } from '@/lib/i18n/dict';

export default function CommentForm({ lessonId, slug, parentId, lang }: { lessonId: string; slug: string; parentId?: string; lang: Lang }) {
  const t = dict[lang].engage;
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const now = useRef(0);

  // The player broadcasts its current time so a comment can link to the exact moment being watched.
  useEffect(() => {
    const onTime = (e: Event) => { now.current = (e as CustomEvent<number>).detail; };
    window.addEventListener('edusite:time', onTime);
    return () => window.removeEventListener('edusite:time', onTime);
  }, []);

  const stamp = () => {
    const s = Math.floor(now.current);
    setBody((b) => `${b}${b && !b.endsWith(' ') ? ' ' : ''}${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} `);
  };

  return (
    <form
      action={async (fd) => {
        setBusy(true);
        try { await postComment(fd); setBody(''); } finally { setBusy(false); }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="lesson_id" value={lessonId} />
      <input type="hidden" name="slug" value={slug} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <textarea
        name="body" required maxLength={2000} rows={parentId ? 2 : 3} value={body} onChange={(e) => setBody(e.target.value)}
        placeholder={parentId ? t.replyHere : t.placeholder}
        className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-400/50 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button disabled={busy} className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-semibold text-zinc-950 transition hover:bg-white active:scale-95 disabled:opacity-50">{parentId ? t.reply : t.post}</button>
        {!parentId && <button type="button" onClick={stamp} className="text-sm text-emerald-400 hover:text-emerald-300">⏱ {t.addTime}</button>}
      </div>
    </form>
  );
}
