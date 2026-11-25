// Subtle fixed corner mark carrying the viewer's identity. data-wm is checked by the player's tamper guard.
export default function Watermark({ text }: { text: string }) {
  return (
    <div data-wm aria-hidden className="pointer-events-none absolute inset-0 z-20 select-none">
      <span className="absolute right-3 top-3 max-w-[75%] text-right text-[11px] leading-tight text-white/35 [text-shadow:0_0_3px_rgb(0_0_0/0.7)]">
        {text}
      </span>
    </div>
  );
}
