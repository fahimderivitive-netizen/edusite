// Subtle moving overlay carrying the viewer's identity. data-wm is checked by the player's tamper guard.
export default function Watermark({ text }: { text: string }) {
  return (
    <div data-wm aria-hidden className="pointer-events-none absolute inset-0 z-20 select-none overflow-hidden">
      <span className="wm-text">{text}</span>
      <span className="wm-text" style={{ animationDelay: '-21s' }}>{text}</span>
    </div>
  );
}
