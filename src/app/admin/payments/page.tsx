import { connection } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, hasServiceKey } from '@/lib/supabase/admin';
import { approvePayment } from '../actions';
import ConfirmButton from '@/components/admin/ConfirmButton';
import { btn } from '@/components/admin/ui';
export const instant = false;

const color: Record<string, string> = { paid: 'text-emerald-400', pending: 'text-amber-300', failed: 'text-red-400', cancelled: 'text-zinc-500', refunded: 'text-zinc-400' };

export default async function AdminPayments() {
  await connection();
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: payments }, { data: courses }, { data: profiles }] = await Promise.all([
    supabase.from('payments').select('id, tran_id, user_id, course_id, amount, status, created_at, paid_at, gateway_payload').order('created_at', { ascending: false }).limit(100),
    supabase.from('courses').select('id, title'),
    supabase.from('profiles').select('id, full_name'),
  ]);
  const emails = new Map<string, string>();
  if (hasServiceKey()) {
    const { data } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 });
    data?.users.forEach((u) => emails.set(u.id, u.email ?? ''));
  }
  const who = (id: string) => emails.get(id) || profiles?.find((p) => p.id === id)?.full_name || id.slice(0, 8);
  const total = (payments ?? []).filter((p) => p.status === 'paid').reduce((n, p) => n + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl">Payments</h1>
        <p className="text-sm text-zinc-400">Paid total (last 100): <span className="font-semibold text-emerald-400">৳{total.toLocaleString('en-US')}</span></p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-[#18181B] text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Transaction</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-[#111113]">
            {(payments ?? []).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">{who(p.user_id)}</td>
                <td className="px-4 py-3 text-zinc-300">{courses?.find((c) => c.id === p.course_id)?.title}</td>
                <td className="px-4 py-3">৳{Number(p.amount).toLocaleString('en-US')}</td>
                <td className={`px-4 py-3 font-medium ${color[p.status] ?? ''}`}>
                  {p.status}
                  {p.status === 'pending' && (p.gateway_payload as { risk_level?: string } | null)?.risk_level === '1' && <span className="block text-xs font-normal text-amber-300">paid, flagged high-risk</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{p.tran_id}</td>
                <td className="px-4 py-3">
                  {p.status === 'pending' && (p.gateway_payload as { status?: string } | null)?.status === 'VALID' && (
                    <form action={approvePayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton className={btn}>Approve</ConfirmButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
