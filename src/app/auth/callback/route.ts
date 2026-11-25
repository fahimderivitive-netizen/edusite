import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Email links (signup confirmation, password reset) land here with ?code=…; we exchange it for a session cookie.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const n = url.searchParams.get('next') ?? '/dashboard';
  const next = n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard'; // never redirect off-site
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL('/login', url.origin));
}
