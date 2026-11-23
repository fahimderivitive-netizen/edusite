import { createClient } from '@supabase/supabase-js';

export const hasServiceKey = () => !!process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service-role client: bypasses RLS. Import only from server code, after your own auth/role check.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
