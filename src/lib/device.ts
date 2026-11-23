import { cookies, headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_DEVICES = Number(process.env.DEVICE_LIMIT ?? 2);

async function deviceId() {
  const jar = await cookies();
  let id = jar.get('did')?.value;
  if (!id) {
    id = crypto.randomUUID();
    jar.set('did', id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  return id;
}

// Keep only the MAX_DEVICES most recently active devices; older ones are revoked.
async function enforce(userId: string) {
  const a = createAdminClient();
  const { data } = await a.from('user_sessions').select('id').eq('user_id', userId).eq('revoked', false).order('last_seen', { ascending: false });
  const extra = (data ?? []).slice(MAX_DEVICES).map((r) => r.id);
  if (extra.length) await a.from('user_sessions').update({ revoked: true }).in('id', extra);
}

// Route-handler only (sets a cookie). 'revoked' means this device was kicked by a newer login elsewhere.
export async function ensureDevice(userId: string): Promise<'ok' | 'revoked'> {
  const did = await deviceId();
  const a = createAdminClient();
  const { data: row } = await a.from('user_sessions').select('id, revoked').eq('user_id', userId).eq('device_id', did).maybeSingle();
  if (row?.revoked) return 'revoked';
  if (row) {
    await a.from('user_sessions').update({ last_seen: new Date().toISOString() }).eq('id', row.id);
    return 'ok';
  }
  const ua = (await headers()).get('user-agent') ?? '';
  await a.from('user_sessions').insert({ user_id: userId, device_id: did, label: ua.slice(0, 120) });
  await enforce(userId);
  return 'ok';
}

// The student explicitly chooses this device; the least recently active other device is revoked.
export async function claimDevice(userId: string) {
  const did = await deviceId();
  const a = createAdminClient();
  const ua = (await headers()).get('user-agent') ?? '';
  await a.from('user_sessions').upsert(
    { user_id: userId, device_id: did, label: ua.slice(0, 120), revoked: false, last_seen: new Date().toISOString() },
    { onConflict: 'user_id,device_id' },
  );
  await enforce(userId);
}
