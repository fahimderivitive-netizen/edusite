'use client';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

// Hamburger menu for small screens. Any click inside the panel (a link or button) closes it.
export default function MobileMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={label}
        aria-expanded={open}
        className="rounded-md p-2 text-zinc-300 transition hover:bg-white/5 hover:text-zinc-100"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div onClick={() => setOpen(false)} className="absolute inset-x-0 top-16 border-b border-white/10 bg-[#09090B] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col gap-1">{children}</div>
        </div>
      )}
    </div>
  );
}
