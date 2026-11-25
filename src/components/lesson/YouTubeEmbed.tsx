'use client';
import { useEffect, useRef } from 'react';
import Watermark from './Watermark';

const ORIGIN = 'https://www.youtube-nocookie.com';

// YouTube player for FREE PREVIEW lessons only (the server refuses it for paid lessons).
// Bridges the same 'edusite:seek' / 'edusite:time' events the Bunny player uses, so timestamp comments still work.
export default function YouTubeEmbed({ id, mark, title }: { id: string; mark: string; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const send = (msg: object) => frame.current?.contentWindow?.postMessage(JSON.stringify(msg), ORIGIN);
    const onSeek = (e: Event) => {
      const s = (e as CustomEvent<number>).detail;
      if (!Number.isFinite(s)) return;
      send({ event: 'command', func: 'seekTo', args: [s, true] });
      send({ event: 'command', func: 'playVideo', args: [] });
    };
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== 'string') return;
      try {
        const t = JSON.parse(e.data)?.info?.currentTime;
        if (typeof t === 'number') window.dispatchEvent(new CustomEvent('edusite:time', { detail: t }));
      } catch {
        // not a player message
      }
    };
    window.addEventListener('edusite:seek', onSeek);
    window.addEventListener('message', onMsg);
    return () => {
      window.removeEventListener('edusite:seek', onSeek);
      window.removeEventListener('message', onMsg);
    };
  }, []);

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
      <iframe
        ref={frame}
        src={`${ORIGIN}/embed/${id}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1`}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), ORIGIN)}
        className="h-full w-full"
      />
      <Watermark text={mark} />
    </div>
  );
}
