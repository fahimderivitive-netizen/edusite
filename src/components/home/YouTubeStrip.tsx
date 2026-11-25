/* eslint-disable @next/next/no-img-element */
import { ArrowRight, Play } from 'lucide-react';
import { dict, type Lang } from '@/lib/i18n/dict';
import { latestVideos, YOUTUBE_URL } from '@/lib/youtube';

export default async function YouTubeStrip({ lang }: { lang: Lang }) {
  const videos = await latestVideos(3);
  if (!videos.length) return null;
  const t = dict[lang].home;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl">{t.youtube}</h2>
        <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm text-zinc-400 transition hover:text-emerald-400">
          {t.visitChannel} <ArrowRight size={16} />
        </a>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {videos.map((v) => (
          <a
            key={v.id}
            href={`https://www.youtube.com/watch?v=${v.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-xl border border-white/10 bg-[#111113] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
          >
            <div className="relative aspect-video overflow-hidden bg-zinc-900">
              <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/10">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"><Play size={20} fill="currentColor" /></span>
              </span>
            </div>
            <p className="line-clamp-2 p-4 text-sm font-medium leading-snug text-zinc-200">{v.title}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
