'use client';

export default function ConfirmButton({ children, className, message = 'Delete this? This cannot be undone.' }: { children: React.ReactNode; className?: string; message?: string }) {
  return (
    <button className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
