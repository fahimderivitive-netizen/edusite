import { getLang } from '@/lib/i18n/server';
import { legal, type LegalKey } from '@/lib/legal';

export default async function LegalPage({ doc }: { doc: LegalKey }) {
  const lang = await getLang();
  const d = legal[doc][lang];
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="mb-8 text-3xl sm:text-4xl">{d.title}</h1>
      <div className="space-y-8">
        {d.sections.map((s, i) => (
          <section key={s.h}>
            <h2 className="mb-2 text-lg text-zinc-100">{i + 1}. {s.h}</h2>
            <p className="leading-relaxed text-zinc-400">{s.p}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
