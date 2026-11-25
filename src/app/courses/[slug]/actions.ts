'use server';
import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, hasServiceKey } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth';
import { parse } from '@/lib/validate';
import { limit } from '@/lib/ratelimit';
import { initSession, siteUrl, sslConfigured } from '@/lib/sslcommerz';
import { validateCoupon, type CouponFail } from '@/lib/coupons';

export type CouponPreview =
  | { ok: true; code: string; discount: number; final: number }
  | { ok: false; reason: CouponFail | 'rate' };

// Shows the student what a code would do. The real price is recomputed again when they pay.
export async function previewCoupon(courseId: string, code: string): Promise<CouponPreview> {
  const user = await requireUser();
  if (!z.guid().safeParse(courseId).success) return { ok: false, reason: 'invalid' };
  if (!(await limit(`coupon:${user.id}`, 15, 300))) return { ok: false, reason: 'rate' };
  const supabase = await createClient();
  const { data: course } = await supabase.from('courses').select('price').eq('id', courseId).eq('published', true).maybeSingle();
  if (!course || Number(course.price) <= 0) return { ok: false, reason: 'invalid' };
  const r = await validateCoupon({ code, courseId, userId: user.id, price: Number(course.price) });
  return r.ok ? { ok: true, code: r.code, discount: r.discount, final: r.final } : r;
}

export async function startPayment(fd: FormData) {
  const user = await requireUser();
  const { course_id } = parse(z.object({ course_id: z.guid() }), fd);
  if (!(await limit(`pay:${user.id}`, 5, 300))) throw new Error('Too many attempts. Please wait a few minutes.');
  if (!sslConfigured() || !hasServiceKey()) throw new Error('Online payment is not configured yet.');

  const supabase = await createClient();
  // Price always comes from the database, never from the client.
  const { data: course } = await supabase.from('courses').select('id, slug, title, price').eq('id', course_id).eq('published', true).maybeSingle();
  if (!course || Number(course.price) <= 0) throw new Error('This course is not available for purchase.');
  const { data: enrolled } = await supabase.from('enrollments').select('id').eq('course_id', course.id).eq('user_id', user.id).maybeSingle();
  if (enrolled) redirect(`/courses/${course.slug}`);
  const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle();

  // Optional coupon: validated again here, so a stale or tampered preview cannot lower the price.
  const listPrice = Number(course.price);
  let amount = listPrice;
  let discount = 0;
  let couponId: string | null = null;
  const couponCode = String(fd.get('coupon') ?? '').trim();
  if (couponCode) {
    const r = await validateCoupon({ code: couponCode, courseId: course.id, userId: user.id, price: listPrice });
    if (!r.ok) redirect(`/courses/${course.slug}?coupon=${r.reason}`);
    amount = r.final;
    discount = r.discount;
    couponId = r.couponId;
  }

  const admin = createAdminClient();
  const tran_id = `EDU${Date.now()}${randomBytes(4).toString('hex')}`;
  const base = { tran_id, user_id: user.id, course_id: course.id, amount, currency: 'BDT', list_price: listPrice, discount_amount: discount, coupon_id: couponId };

  if (amount === 0) {
    // A 100% coupon: nothing to charge, so skip the gateway and enroll straight away (still recorded as a payment).
    const { data: pay, error } = await admin.from('payments').insert({ ...base, status: 'paid', paid_at: new Date().toISOString() }).select('id').single();
    if (error) throw new Error(error.message);
    const { error: eErr } = await admin.from('enrollments').insert({ user_id: user.id, course_id: course.id, source: 'payment', payment_id: pay.id });
    if (eErr && eErr.code !== '23505') throw new Error(eErr.message);
    await admin.rpc('redeem_coupon', { p_payment: pay.id });
    redirect(`/courses/${course.slug}?pay=success`);
  }

  const { error } = await admin.from('payments').insert(base);
  if (error) throw new Error(error.message);

  const site = siteUrl();
  const url = await initSession({
    total_amount: String(amount), currency: 'BDT', tran_id,
    success_url: `${site}/api/payments/sslcommerz/success`,
    fail_url: `${site}/api/payments/sslcommerz/fail`,
    cancel_url: `${site}/api/payments/sslcommerz/cancel`,
    ipn_url: `${site}/api/payments/sslcommerz/ipn`,
    cus_name: profile?.full_name || user.email || 'Student', cus_email: user.email ?? '',
    cus_add1: 'Dhaka', cus_city: 'Dhaka', cus_postcode: '1200', cus_country: 'Bangladesh',
    cus_phone: profile?.phone || '01700000000',
    shipping_method: 'NO', product_name: course.title, product_category: 'Education', product_profile: 'non-physical-goods',
  });
  redirect(url);
}
