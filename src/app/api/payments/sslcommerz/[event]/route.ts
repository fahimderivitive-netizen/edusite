import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient, hasServiceKey } from '@/lib/supabase/admin';
import { sslConfigured, validate, verifySign, siteUrl } from '@/lib/sslcommerz';

type Pay = { id: string; tran_id: string; user_id: string; course_id: string; amount: number; status: string };

// Marks the payment paid and creates the enrollment, only after SSLCommerz confirms it server-side. Idempotent.
async function settle(pay: Pay, body: Record<string, string>, ipn: boolean) {
  if (pay.status === 'paid') return true;
  if (ipn && !verifySign(body)) return false;
  if (!body.val_id) return false;
  const admin = createAdminClient();
  const val = await validate(body.val_id);
  const paidOk =
    (val.status === 'VALID' || val.status === 'VALIDATED') &&
    val.tran_id === pay.tran_id &&
    val.currency_type === 'BDT' &&
    Number(val.currency_amount ?? val.amount) === Number(pay.amount);
  if (!paidOk) {
    await admin.from('payments').update({ status: 'failed', gateway_payload: val }).eq('id', pay.id).neq('status', 'paid');
    return false;
  }
  if (val.risk_level === '1') {
    // High-risk flag from the gateway: keep pending for manual review instead of enrolling automatically.
    await admin.from('payments').update({ gateway_payload: val }).eq('id', pay.id).neq('status', 'paid');
    return false;
  }
  await admin.from('payments').update({
    status: 'paid', val_id: body.val_id, bank_tran_id: val.bank_tran_id, card_type: val.card_type,
    gateway_payload: val, paid_at: new Date().toISOString(),
  }).eq('id', pay.id);
  const { error } = await admin.from('enrollments').insert({ user_id: pay.user_id, course_id: pay.course_id, source: 'payment', payment_id: pay.id });
  if (error && error.code !== '23505') throw new Error(error.message);
  return true;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ event: string }> }) {
  const { event } = await params;
  if (!['success', 'fail', 'cancel', 'ipn'].includes(event)) return new NextResponse('Not found', { status: 404 });
  const site = siteUrl(new URL(req.url).origin);
  if (!sslConfigured() || !hasServiceKey()) return NextResponse.redirect(`${site}/courses`, 303);

  const form = await req.formData();
  const body = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const admin = createAdminClient();
  const { data: pay } = await admin.from('payments').select('id, tran_id, user_id, course_id, amount, status').eq('tran_id', body.tran_id ?? '').maybeSingle();
  if (!pay) return event === 'ipn' ? NextResponse.json({ ok: false }, { status: 400 }) : NextResponse.redirect(`${site}/courses`, 303);
  const { data: course } = await admin.from('courses').select('slug').eq('id', pay.course_id).maybeSingle();
  const back = `${site}/courses/${course?.slug ?? ''}`;

  if (event === 'fail' || event === 'cancel') {
    if (pay.status === 'pending') await admin.from('payments').update({ status: event === 'fail' ? 'failed' : 'cancelled' }).eq('id', pay.id);
    return NextResponse.redirect(`${back}?pay=${event}`, 303);
  }
  const ok = await settle(pay as Pay, body, event === 'ipn');
  if (event === 'ipn') return NextResponse.json({ ok });
  return NextResponse.redirect(`${back}?pay=${ok ? 'success' : 'fail'}`, 303);
}
