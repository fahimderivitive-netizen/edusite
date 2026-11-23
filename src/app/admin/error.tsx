'use client';

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
      <p className="font-medium text-red-300">Something went wrong</p>
      <p className="mt-1 text-sm text-red-200/80">{error.message}</p>
      <button onClick={reset} className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5">
        Try again
      </button>
    </div>
  );
}
