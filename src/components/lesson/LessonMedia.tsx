'use client';
import { useEffect, useState } from 'react';
import { Lock, PlayCircle } from 'lucide-react';
import VideoPlayer, { type VideoSrc } from './VideoPlayer';
import PdfViewer from './PdfViewer';
import { dict, type Lang } from '@/lib/i18n/dict';

type State =
  | { status: 'loading' }
  | { status: 'ok'; video: VideoSrc | null; pdfUrl: string | null }
  | { status: 'error'; code: string };

export default function LessonMedia({ lessonId, mark, lang }: { lessonId: string; mark: string; lang: Lang }) {
  const t = dict[lang].lesson;
  const [state, setState] = useState<State>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch(`/api/lessons/${lessonId}/media`, { cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json();
        if (alive) setState(r.ok ? { status: 'ok', video: j.video, pdfUrl: j.pdfUrl } : { status: 'error', code: j.error ?? 'error' });
      })
      .catch(() => alive && setState({ status: 'error', code: 'network' }));
    return () => { alive = false; };
  }, [lessonId, nonce]);

  async function claim() {
    setState({ status: 'loading' });
    await fetch('/api/device/claim', { method: 'POST' });
    setNonce((n) => n + 1);
  }

  const box = 'flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#111113] p-6 text-center text-sm text-zinc-400';
  if (state.status === 'loading') return <div className={box}>{t.loading}</div>;
  if (state.status === 'error') {
    if (state.code === 'device_limit')
      return (
        <div className={box}>
          <Lock size={20} />
          <p className="max-w-md">{t.deviceLimit}</p>
          <button onClick={claim} className="rounded-full bg-emerald-400 px-5 py-2 font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95">{t.useDevice}</button>
        </div>
      );
    return <div className={box}>{state.code === 'not_configured' ? t.notConfigured : t.mediaError}</div>;
  }
  if (!state.video && !state.pdfUrl)
    return (
      <div className={`${box} text-zinc-600`}>
        <PlayCircle size={18} className="h-14 w-14" strokeWidth={1} />
        {t.noVideo}
      </div>
    );
  return (
    <div className="space-y-6">
      {state.video && <VideoPlayer video={state.video} mark={mark} lang={lang} />}
      {state.pdfUrl && (
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">{t.pdf}</p>
          <PdfViewer url={state.pdfUrl} mark={mark} title={t.pdf} />
        </div>
      )}
    </div>
  );
}
