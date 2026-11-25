'use client';

const BN = '০১২৩৪৫৬৭৮৯';
const ascii = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));
const SPLIT = /(?<![\d০-৯])([\d০-৯]{1,2}:[\d০-৯]{2})(?![\d০-৯])/;
const IS_TS = /^[\d০-৯]{1,2}:[\d০-৯]{2}$/;

// Renders text where mm:ss patterns (English or Bangla digits) become buttons that seek the lesson video.
export default function TimestampText({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">
      {text.split(SPLIT).map((part, i) =>
        IS_TS.test(part) ? (
          <button
            key={i}
            onClick={() => {
              const [m, s] = ascii(part).split(':').map(Number);
              window.dispatchEvent(new CustomEvent('edusite:seek', { detail: m * 60 + s }));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="rounded bg-emerald-400/10 px-1.5 font-mono text-emerald-300 transition hover:bg-emerald-400/20"
          >
            {part}
          </button>
        ) : (
          part
        ),
      )}
    </p>
  );
}
