import { createAdminClient } from '@/lib/supabase/admin';

export type CouponFail = 'invalid' | 'expired' | 'not_started' | 'exhausted' | 'wrong_course' | 'already_used' | 'minimum';
export type CouponResult =
  | { ok: true; couponId: string; code: string; discount: number; final: number }
  | { ok: false; reason: CouponFail };

// SSLCommerz cannot take tiny payments, so a coupon may not leave a positive amount below this (BDT).
export const MIN_PAYABLE = 10;

// Server-only. The price is always passed in from the database; the browser never supplies an amount.
export async function validateCoupon(i: { code: string; courseId: string; userId: string; price: number }): Promise<CouponResult> {
  const code = i.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return { ok: false, reason: 'invalid' };
  const admin = createAdminClient();
  const { data: c } = await admin.from('coupons').select('*').eq('code', code).maybeSingle();
  if (!c || !c.active) return { ok: false, reason: 'invalid' };
  const now = Date.now();
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { ok: false, reason: 'not_started' };
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return { ok: false, reason: 'expired' };
  if (c.course_id && c.course_id !== i.courseId) return { ok: false, reason: 'wrong_course' };
  if (c.max_uses !== null && c.used_count >= c.max_uses) return { ok: false, reason: 'exhausted' };
  const { count } = await admin.from('coupon_redemptions').select('id', { count: 'exact', head: true }).eq('coupon_id', c.id).eq('user_id', i.userId);
  if ((count ?? 0) >= c.per_user_limit) return { ok: false, reason: 'already_used' };

  const discount = c.kind === 'percent' ? Math.round((i.price * Number(c.value)) / 100) : Math.min(Number(c.value), i.price);
  const final = Math.max(0, i.price - discount);
  if (final > 0 && final < MIN_PAYABLE) return { ok: false, reason: 'minimum' };
  return { ok: true, couponId: c.id, code, discount, final };
}
