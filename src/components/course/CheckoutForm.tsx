'use client';
import { useState, useTransition } from 'react';
import { dict, money, type Lang } from '@/lib/i18n/dict';
import type { CouponPreview } from '@/app/courses/[slug]/actions';

// Buy button with an optional coupon box. The preview is only for display; the server recomputes the price when paying.
export default function CheckoutForm({ courseId, price, lang, loggedIn, startPayment, previewCoupon }: {
  courseId: string; price: number; lang: Lang; loggedIn: boolean;
  startPayment: (fd: FormData) => Promise<void>;
  previewCoupon: (courseId: string, code: string) => Promise<CouponPreview>;
}) {
  const t = dict[lang].course;
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [res, setRes] = useState<CouponPreview | null>(null);
  const [pending, start] = useTransition();
  const applied = res?.ok ? res : null;
  const final = applied ? applied.final : price;
  const apply = () => { if (code.trim()) start(async () => setRes(await previewCoupon(courseId, code))); };

  return (
    <form action={startPayment}>
      <input type="hidden" name="course_id" value={courseId} />
      {applied && <input type="hidden" name="coupon" value={applied.code} />}

      {loggedIn && (open ? (
        <div className="mb-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setRes(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}
              placeholder={t.couponPlaceholder}
              maxLength={32}
              autoCapitalize="characters"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm uppercase text-zinc-100 placeholder:normal-case placeholder:text-zinc-600 focus:border-emerald-400/50 focus:outline-none"
            />
            <button type="button" onClick={apply} disabled={pending || !code.trim()} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:border-white/20 disabled:opacity-50">
              {t.apply}
            </button>
          </div>
          {res && !res.ok && <p className="text-xs text-red-300">{t.coupon[res.reason] ?? t.coupon.invalid}</p>}
          {applied && <p className="text-xs text-emerald-300">✓ {applied.code} · {t.couponApplied.replace('{n}', money(applied.discount, lang))}</p>}
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="mb-3 text-sm text-emerald-400 transition hover:text-emerald-300">{t.haveCoupon}</button>
      ))}

      <button className="w-full rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 shadow-[0_0_24px_rgba(92,225,230,0.3)] transition hover:bg-emerald-300 active:scale-[0.98]">
        {final === 0 ? t.enrollWithCoupon : `${t.buy} · ${money(final, lang)}`}
        {applied && final > 0 && <span className="ml-2 text-xs font-normal line-through opacity-60">{money(price, lang)}</span>}
      </button>
    </form>
  );
}
