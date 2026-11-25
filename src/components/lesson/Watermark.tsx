'use client';
import { useEffect, useState } from 'react';

// Still corner mark that hops to the next corner every 30 s, so it is unobtrusive but not croppable from one spot.
// data-wm is checked by the player's tamper guard. Bottom corners sit above the player's control bar.
const CORNERS = ['right-3 top-3 text-right', 'left-3 top-3 text-left', 'left-3 bottom-14 text-left', 'right-3 bottom-14 text-right'];

export default function Watermark({ text }: { text: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % CORNERS.length), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div data-wm aria-hidden className="pointer-events-none absolute inset-0 z-20 select-none">
      <span className={`absolute max-w-[75%] text-[11px] leading-tight text-white/35 [text-shadow:0_0_3px_rgb(0_0_0/0.7)] ${CORNERS[i]}`}>
        {text}
      </span>
    </div>
  );
}
