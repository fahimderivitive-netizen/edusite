'use client';

// Renders text where mm:ss patterns become buttons that seek the lesson video.
export default function TimestampText({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">
      {text.split(/(\b\d{1,2}:\d{2}\b)/g).map((part, i) =>
        /^\d{1,2}:\d{2}$/.test(part) ? (
          <button
            key={i}
            onClick={() => {
              const [m, s] = part.split(':').map(Number);
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
