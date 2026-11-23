export const input =
  'w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20';
export const btn =
  'rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95';
export const btnGhost =
  'rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:text-zinc-100 active:scale-95';
export const btnDanger =
  'rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10 active:scale-95';
export const card = 'rounded-xl border border-white/10 bg-[#111113] p-5';

export function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 text-xs font-medium text-zinc-400 ${className}`}>
      {label}
      {children}
    </label>
  );
}
