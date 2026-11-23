'use client';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Maximize, Minimize, Pause, Play, Settings, Volume2, VolumeX } from 'lucide-react';
import Watermark from './Watermark';
import { dict, type Lang } from '@/lib/i18n/dict';

export type VideoSrc = { src: string; kind: 'hls' | 'file'; qs?: string };
const SPEEDS = [0.5, 1, 1.25, 1.5, 2];
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function VideoPlayer({ video, mark, lang }: { video: VideoSrc; mark: string; lang: Lang }) {
  const t = dict[lang].lesson;
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [heights, setHeights] = useState<number[]>([]);
  const [level, setLevel] = useState(-1);
  const [menu, setMenu] = useState<null | 'speed' | 'quality'>(null);
  const [full, setFull] = useState(false);
  const [tampered, setTampered] = useState(false);

  useEffect(() => {
    const v = vid.current;
    if (!v) return;
    const qs = video.qs;
    let hls: Hls | null = null;
    if (video.kind === 'hls' && Hls.isSupported()) {
      hls = new Hls({
        xhrSetup: qs
          ? (xhr, url) => {
              if (!url.includes('token=')) xhr.open('GET', `${url}${url.includes('?') ? '&' : '?'}${qs}`, true);
            }
          : undefined,
      });
      hls.loadSource(video.src);
      hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, () => setHeights(hls!.levels.map((l) => l.height)));
    } else {
      v.src = qs ? `${video.src}?${qs}` : video.src;
    }
    hlsRef.current = hls;
    return () => {
      hls?.destroy();
      hlsRef.current = null;
    };
  }, [video]);

  // Timestamp links elsewhere on the page dispatch window event 'edusite:seek' with a number of seconds.
  useEffect(() => {
    const onSeek = (e: Event) => {
      const s = (e as CustomEvent<number>).detail;
      const v = vid.current;
      if (v && Number.isFinite(s)) {
        v.currentTime = s;
        void v.play();
      }
    };
    window.addEventListener('edusite:seek', onSeek);
    return () => window.removeEventListener('edusite:seek', onSeek);
  }, []);

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === box.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Deterrent: pause playback if the watermark node is removed or hidden.
  useEffect(() => {
    const id = setInterval(() => {
      const w = box.current?.querySelector<HTMLElement>('[data-wm]');
      const s = w ? getComputedStyle(w) : null;
      if (!s || s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) {
        vid.current?.pause();
        setTampered(true);
      }
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const toggle = () => {
    const v = vid.current;
    if (v) void (v.paused ? v.play() : v.pause());
  };
  const pickRate = (r: number) => {
    if (vid.current) vid.current.playbackRate = r;
    setRate(r);
    setMenu(null);
  };
  const pickLevel = (l: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = l;
    setLevel(l);
    setMenu(null);
  };
  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void box.current?.requestFullscreen();
  };

  return (
    <div ref={box} className={`relative overflow-hidden bg-black ${full ? 'h-screen w-screen' : 'aspect-video rounded-xl ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]'}`}>
      <video
        ref={vid}
        playsInline
        disablePictureInPicture
        controlsList="nodownload noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          setTime(e.currentTarget.currentTime);
          window.dispatchEvent(new CustomEvent('edusite:time', { detail: e.currentTarget.currentTime }));
        }}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        className="h-full w-full bg-black"
      />
      <Watermark text={mark} />

      {tampered && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/90 p-6 text-center text-sm text-red-300">{t.tamper}</div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-30 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 text-zinc-100">
        <button onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="transition hover:text-emerald-400">
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <span className="w-24 shrink-0 text-xs tabular-nums text-zinc-300">{clock(time)} / {clock(dur || 0)}</span>
        <input
          type="range" min={0} max={dur || 0} step={0.1} value={time}
          onChange={(e) => { if (vid.current) vid.current.currentTime = Number(e.target.value); }}
          aria-label="Seek" className="h-1 flex-1 cursor-pointer accent-emerald-400"
        />
        <button
          onClick={() => { if (vid.current) { vid.current.muted = !muted; setMuted(!muted); } }}
          aria-label="Mute" className="transition hover:text-emerald-400"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <div className="relative">
          <button onClick={() => setMenu(menu ? null : 'speed')} aria-label="Settings" className="flex items-center gap-1 text-xs transition hover:text-emerald-400">
            <Settings size={18} /> {rate}x
          </button>
          {menu && (
            <div className="absolute bottom-9 right-0 w-40 rounded-lg border border-white/10 bg-zinc-900 p-2 text-sm shadow-xl">
              <div className="mb-2 flex gap-1 text-xs">
                <button onClick={() => setMenu('speed')} className={`flex-1 rounded px-2 py-1 ${menu === 'speed' ? 'bg-white/10' : ''}`}>{t.speed}</button>
                {heights.length > 0 && <button onClick={() => setMenu('quality')} className={`flex-1 rounded px-2 py-1 ${menu === 'quality' ? 'bg-white/10' : ''}`}>{t.quality}</button>}
              </div>
              {menu === 'speed' && SPEEDS.map((r) => (
                <button key={r} onClick={() => pickRate(r)} className={`block w-full rounded px-2 py-1 text-left hover:bg-white/10 ${r === rate ? 'text-emerald-400' : ''}`}>{r}x</button>
              ))}
              {menu === 'quality' && (
                <>
                  <button onClick={() => pickLevel(-1)} className={`block w-full rounded px-2 py-1 text-left hover:bg-white/10 ${level === -1 ? 'text-emerald-400' : ''}`}>{t.auto}</button>
                  {heights.map((h, i) => (
                    <button key={i} onClick={() => pickLevel(i)} className={`block w-full rounded px-2 py-1 text-left hover:bg-white/10 ${level === i ? 'text-emerald-400' : ''}`}>{h}p</button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <button onClick={toggleFull} aria-label="Fullscreen" className="transition hover:text-emerald-400">
          {full ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </div>
  );
}
