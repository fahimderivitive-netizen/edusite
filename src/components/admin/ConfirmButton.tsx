'use client';
import { useEffect, useState } from 'react';

// Two-click confirmation without native dialogs: first click arms the button, second click submits the form.
export default function ConfirmButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);

  return (
    <button
      className={`${className ?? ''} ${armed ? '!bg-red-500/20 !text-red-200' : ''}`}
      onClick={(e) => {
        if (!armed) {
          e.preventDefault();
          setArmed(true);
        }
      }}
    >
      {armed ? 'Click again to confirm' : children}
    </button>
  );
}
