'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { parse } from '@/lib/validate';

export async function updateProfile(fd: FormData) {
  const user = await requireUser();
  const v = parse(z.object({
    full_name: z.string().trim().min(1, 'Name is required').max(80),
    phone: z.string().trim().regex(/^((\+?88)?01[3-9]\d{8})?$/, 'Enter a valid mobile number like 01XXXXXXXXX'),
  }), fd);
  const supabase = await createClient();
  // RLS lets users update only their own row; a trigger blocks any change to role or scopes.
  const { error } = await supabase.from('profiles').update({ full_name: v.full_name, phone: v.phone || null }).eq('id', user.id);
  if (error) throw new Error(error.message);
  redirect('/profile?saved=1');
}
