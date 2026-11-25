import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient, hasServiceKey } from '@/lib/supabase/admin';
import { sslConfigured, siteUrl } from '@/lib/sslcommerz';
import { settle, type Pay } from '@/lib/payments';

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
  const result = await settle(pay as Pay, body, { ipn: event === 'ipn' });
  if (event === 'ipn') return NextResponse.json({ ok: result === 'paid' });
  return NextResponse.redirect(`${back}?pay=${result === 'paid' ? 'success' : result === 'review' ? 'review' : 'fail'}`, 303);
}
