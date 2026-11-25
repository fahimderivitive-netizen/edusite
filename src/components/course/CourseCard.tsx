import Link from 'next/link';
import { ArrowRight, BookOpen, Code2, Database, Palette } from 'lucide-react';
import { dict, money, pick, type Lang } from '@/lib/i18n/dict';

export type CourseSummary = {
  id: string;
  slug: string;
  title: string;
  title_bn: string | null;
  description: string | null;
  description_bn: string | null;
  price: number;
  category: string | null;
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

export default function CourseCard({ course, lang }: { course: CourseSummary; lang: Lang }) {
  const t = dict[lang];
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111113] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
    >
      <CourseCover category={course.category} />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between">
          {course.category ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-300">{t.categories[course.category] ?? course.category}</span>
          ) : <span />}
          <span className="text-sm font-semibold text-emerald-400">
            {Number(course.price) === 0 ? t.card.free : money(course.price, lang)}
          </span>
        </div>
        <h3 className="mb-2 text-lg text-zinc-100">{pick(lang, course.title, course.title_bn)}</h3>
        <p className="mb-5 line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-400">{pick(lang, course.description, course.description_bn)}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 transition group-hover:text-emerald-400">
          {t.card.view} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
