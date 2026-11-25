'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { parse, opt } from '@/lib/validate';

export async function createCoupon(fd: FormData) {
  await requireAdmin();
  const v = parse(z.object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,32}$/, 'Code must be 3–32 characters: letters, numbers, - or _'),
    kind: z.enum(['percent', 'fixed']),
    value: z.coerce.number().positive('Discount must be more than 0'),
    course_id: z.string().optional(),
    max_uses: z.string().optional(),
    per_user_limit: z.coerce.number().int().min(1).default(1),
    expires: z.string().optional(),
    note: opt,
  }), fd);
  if (v.kind === 'percent' && v.value > 100) throw new Error('A percent discount cannot be more than 100');
  const maxUses = v.max_uses ? Number(v.max_uses) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) throw new Error('Total uses must be a whole number of 1 or more');
  const courseId = v.course_id ? z.guid().parse(v.course_id) : null;
  const supabase = await createClient();
  const { error } = await supabase.from('coupons').insert({
    code: v.code, kind: v.kind, value: v.value, course_id: courseId, max_uses: maxUses,
    per_user_limit: v.per_user_limit, expires_at: v.expires ? `${v.expires}T23:59:59+06:00` : null, note: v.note,
  });
  if (error) throw new Error(error.code === '23505' ? 'That coupon code already exists' : error.message);
  revalidatePath('/admin/coupons');
}

export async function toggleCoupon(fd: FormData) {
  await requireAdmin();
  const v = parse(z.object({ id: z.guid(), active: z.enum(['true', 'false']) }), fd);
  const supabase = await createClient();
  const { error } = await supabase.from('coupons').update({ active: v.active === 'true' }).eq('id', v.id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/coupons');
}

export async function deleteCoupon(fd: FormData) {
  await requireAdmin();
  const v = parse(z.object({ id: z.guid() }), fd);
  const supabase = await createClient();
  const { error } = await supabase.from('coupons').delete().eq('id', v.id);
  if (error) throw new Error(error.code === '23503' ? 'This coupon has been used, so it cannot be deleted. Deactivate it instead.' : error.message);
  revalidatePath('/admin/coupons');
}
