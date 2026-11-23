import { createHash } from 'node:crypto';

const base = process.env.SSLCOMMERZ_LIVE === '1' ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com';
const storeId = () => process.env.SSLCOMMERZ_STORE_ID!;
const storePass = () => process.env.SSLCOMMERZ_STORE_PASSWORD!;
const md5 = (s: string) => createHash('md5').update(s).digest('hex');

export const sslConfigured = () => !!(process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD);

export function siteUrl(fallback?: string) {
  return (process.env.NEXT_PUBLIC_SITE_URL || fallback || 'http://localhost:3000').replace(/\/$/, '');
}

export async function initSession(params: Record<string, string>): Promise<string> {
  const res = await fetch(`${base}/gwprocess/v4/api.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ store_id: storeId(), store_passwd: storePass(), ...params }),
    cache: 'no-store',
  });
  const j = await res.json();
  if (j.status !== 'SUCCESS' || !j.GatewayPageURL) throw new Error(j.failedreason || 'Could not start the payment');
  return j.GatewayPageURL as string;
}

export type Validation = {
  status?: string; tran_id?: string; amount?: string; currency_type?: string; currency_amount?: string;
  bank_tran_id?: string; card_type?: string; risk_level?: string; [k: string]: unknown;
};

// Server-to-server check of a val_id. Never trust the browser redirect or POST body alone.
export async function validate(valId: string): Promise<Validation> {
  const q = new URLSearchParams({ val_id: valId, store_id: storeId(), store_passwd: storePass(), format: 'json' });
  const res = await fetch(`${base}/validator/api/validationserverAPI.php?${q}`, { cache: 'no-store' });
  return res.json();
}

// IPN signature: md5 of the fields listed in verify_key (sorted, plus md5(store password)), compared to verify_sign.
export function verifySign(body: Record<string, string>): boolean {
  if (!body.verify_sign || !body.verify_key) return false;
  const data: Record<string, string> = {};
  for (const k of body.verify_key.split(',')) data[k] = body[k] ?? '';
  data.store_passwd = md5(storePass());
  const str = Object.keys(data).sort().map((k) => `${k}=${data[k]}`).join('&');
  return md5(str) === body.verify_sign;
}
