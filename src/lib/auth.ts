import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Scope = 'content' | 'qna' | 'support';
export type Staff = { id: string; email: string; role: 'admin' | 'moderator'; scopes: string[] };

// Server-side only. Never trust client-side role checks; RLS (has_scope) is the second line of defence.
export async function requireStaff(scope?: Scope): Promise<Staff> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: p } = await supabase.from('profiles').select('role, mod_scopes').eq('id', user.id).maybeSingle();
  if (!p || (p.role !== 'admin' && p.role !== 'moderator')) redirect('/');
  const scopes: string[] = p.role === 'admin' ? ['content', 'qna', 'support'] : (p.mod_scopes ?? []);
  if (scope && !scopes.includes(scope)) redirect('/admin');
  return { id: user.id, email: user.email ?? '', role: p.role, scopes };
}

export async function requireAdmin(): Promise<Staff> {
  const s = await requireStaff();
  if (s.role !== 'admin') redirect('/admin');
  return s;
}

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return user;
}
