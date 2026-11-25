import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const TYPES: EmailOtpType[] = ['signup', 'recovery', 'email', 'invite', 'magiclink', 'email_change'];

// Email links (confirm signup, reset password) point here with ?token_hash=…&type=…. Unlike the PKCE ?code= flow,
// this works even when the email is opened on a different device or browser than the one used to sign up.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const n = url.searchParams.get('next') ?? '/dashboard';
  const next = n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard'; // never redirect off-site
  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL('/login', url.origin));
}
