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

  const tran_id = `EDU${Date.now()}${randomBytes(4).toString('hex')}`;
  const { error } = await createAdminClient().from('payments').insert({ tran_id, user_id: user.id, course_id: course.id, amount: course.price, currency: 'BDT' });
  if (error) throw new Error(error.message);

  const site = siteUrl();
  const url = await initSession({
    total_amount: String(course.price), currency: 'BDT', tran_id,
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
