'use client';
import { useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import CourseCard, { type CourseSummary } from './CourseCard';
import { dict, pick, type Lang } from '@/lib/i18n/dict';

export default function CourseList({ courses, lang }: { courses: CourseSummary[]; lang: Lang }) {
  const t = dict[lang];
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const categories = [...new Set(courses.map((c) => c.category).filter(Boolean))] as string[];

  const filtered = courses.filter(
    (c) =>
      pick(lang, c.title, c.title_bn).toLowerCase().includes(search.toLowerCase()) &&
      (category === 'all' || c.category === category)
  );

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition ${
                category === c
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.15)]'
                  : 'border-white/10 bg-[#111113] text-zinc-400 hover:border-white/20 hover:text-zinc-100'
              }`}
            >
              {c === 'all' ? t.courses.all : t.categories[c] ?? c}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder={t.courses.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#111113] py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
      </div>
      {filtered.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} lang={lang} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-white/10 bg-[#111113] py-16 text-center">
          <SearchX size={22} className="mb-3 text-zinc-500" />
          <p className="font-medium text-zinc-100">{t.courses.noneTitle}</p>
          <p className="mt-1 text-sm text-zinc-400">{t.courses.noneSub}</p>
        </div>
      )}
    </>
  );
}
