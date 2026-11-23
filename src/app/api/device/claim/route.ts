import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasServiceKey } from '@/lib/supabase/admin';
import { claimDevice } from '@/lib/device';
import { limit } from '@/lib/ratelimit';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await limit(`claim:${user.id}`, 5, 300))) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  if (!hasServiceKey()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  await claimDevice(user.id);
  return NextResponse.json({ ok: true });
}
