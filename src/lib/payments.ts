import { createAdminClient } from '@/lib/supabase/admin';
import { validate, verifySign } from '@/lib/sslcommerz';

export type Pay = { id: string; tran_id: string; user_id: string; course_id: string; amount: number; status: string };
export type Settled = 'paid' | 'review' | 'failed';

// Marks a payment paid and creates the enrollment, only after SSLCommerz confirms it server-side. Idempotent.
// 'review' = confirmed by the gateway but flagged high-risk, so it waits for an admin to approve (skipRisk).
export async function settle(
  pay: Pay,
  body: Record<string, string>,
  opts: { ipn?: boolean; skipRisk?: boolean } = {},
): Promise<Settled> {
  if (pay.status === 'paid') return 'paid';
  if (opts.ipn && !verifySign(body)) return 'failed';
  if (!body.val_id) return 'failed';
  const admin = createAdminClient();
  const val = await validate(body.val_id);
  const confirmed =
    (val.status === 'VALID' || val.status === 'VALIDATED') &&
    val.tran_id === pay.tran_id &&
    val.currency_type === 'BDT' &&
    Number(val.currency_amount ?? val.amount) === Number(pay.amount);
  if (!confirmed) {
    await admin.from('payments').update({ status: 'failed', gateway_payload: val }).eq('id', pay.id).neq('status', 'paid');
    return 'failed';
  }
  if (val.risk_level === '1' && !opts.skipRisk) {
    await admin.from('payments').update({ gateway_payload: val }).eq('id', pay.id).neq('status', 'paid');
    return 'review';
  }
  await admin.from('payments').update({
    status: 'paid', val_id: body.val_id, bank_tran_id: val.bank_tran_id, card_type: val.card_type,
    gateway_payload: val, paid_at: new Date().toISOString(),
  }).eq('id', pay.id);
  const { error } = await admin.from('enrollments').insert({ user_id: pay.user_id, course_id: pay.course_id, source: 'payment', payment_id: pay.id });
  if (error && error.code !== '23505') throw new Error(error.message);
  return 'paid';
}
