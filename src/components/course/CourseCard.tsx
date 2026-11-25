/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Code2, Database, Palette, UserRound } from 'lucide-react';
import { dict, fmt, fmtDuration, money, pick, type Lang } from '@/lib/i18n/dict';
import { thumbUrl } from '@/lib/thumb';

export type CourseSummary = {
  id: string;
  slug: string;
  title: string;
  title_bn: string | null;
  description: string | null;
  description_bn: string | null;
  price: number;
  category: string | null;
  thumbnail_path?: string | null;
  instructor_name?: string | null;
  original_price?: number | null;
  lessons?: number;
  seconds?: number;
};

const covers: Record<string, { bg: string; text: string; Icon: typeof Code2 }> = {
  development: { bg: 'from-emerald-500/25 via-emerald-950/40 to-[#111113]', text: 'text-emerald-300', Icon: Code2 },
  data: { bg: 'from-amber-400/25 via-amber-950/40 to-[#111113]', text: 'text-amber-300', Icon: Database },
  design: { bg: 'from-fuchsia-500/25 via-fuchsia-950/40 to-[#111113]', text: 'text-fuchsia-300', Icon: Palette },
};
const fallback = { bg: 'from-zinc-500/25 via-zinc-900/40 to-[#111113]', text: 'text-zinc-300', Icon: BookOpen };

export function CourseCover({ category, className = 'h-36' }: { category: string | null; className?: string }) {
  const { bg, text, Icon } = (category && covers[category]) || fallback;
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${bg} ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute -right-6 -top-6 h-28 w-28 rotate-12 rounded-3xl border border-white/10" />
      <div className="absolute -bottom-8 right-10 h-20 w-20 rounded-full border border-white/10" />
      <Icon size={28} className={`absolute bottom-4 left-4 ${text}`} />
    </div>
  );
}

// The uploaded course picture, or the generated cover when none was uploaded. Fills its parent.
export function CourseThumb({ course }: { course: { category: string | null; thumbnail_path?: string | null } }) {
  if (course.thumbnail_path) {
    return <img src={thumbUrl(course.thumbnail_path)} alt="" loading="lazy" className="h-full w-full object-cover" />;
  }
  return <CourseCover category={course.category} className="h-full" />;
}

export const discountPct = (price: number, original?: number | null) =>
  original && original > price ? Math.round((1 - price / original) * 100) : 0;

export default function CourseCard({ course, lang }: { course: CourseSummary; lang: Lang }) {
  const t = dict[lang];
  const free = Number(course.price) === 0;
  const off = discountPct(Number(course.price), course.original_price);
  const hasMeta = !!course.lessons || !!course.seconds;
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111113] transition duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-[0_14px_44px_rgba(92,225,230,0.12)]"
    >
      <div className="relative aspect-video overflow-hidden bg-zinc-900">
        <div className="h-full w-full transition duration-500 group-hover:scale-105">
          <CourseThumb course={course} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          {course.category ? (
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-zinc-100 backdrop-blur">{t.categories[course.category] ?? course.category}</span>
          ) : <span />}
          {off > 0 && <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-xs font-bold text-zinc-950">{fmt(t.card.off, off, lang)}</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-zinc-100">{pick(lang, course.title, course.title_bn)}</h3>
        {course.instructor_name && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400"><UserRound size={14} /> {t.card.by} {course.instructor_name}</p>
        )}
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">{pick(lang, course.description, course.description_bn)}</p>
        {hasMeta && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
            {!!course.lessons && <span className="inline-flex items-center gap-1.5"><BookOpen size={14} /> {fmt(t.course.lessons, course.lessons, lang)}</span>}
            {!!course.seconds && <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {fmtDuration(course.seconds, lang)}</span>}
          </div>
        )}
        <div className="flex-1" />
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
          <div className="flex items-baseline gap-2">
            {free ? (
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-bold text-emerald-300">{t.card.free}</span>
            ) : (
              <>
                <span className="text-xl font-bold text-emerald-400">{money(course.price, lang)}</span>
                {off > 0 && <span className="text-sm text-zinc-500 line-through">{money(Number(course.original_price), lang)}</span>}
              </>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-zinc-300 transition group-hover:text-emerald-400">
            {t.card.view} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
