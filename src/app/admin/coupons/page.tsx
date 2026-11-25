import { connection } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createCoupon, deleteCoupon, toggleCoupon } from './actions';
import ConfirmButton from '@/components/admin/ConfirmButton';
import { nowMs } from '@/lib/time';
import { Field, btn, btnDanger, btnGhost, card, input } from '@/components/admin/ui';
export const instant = false;

export default async function AdminCoupons() {
  await connection();
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: coupons }, { data: courses }] = await Promise.all([
    supabase.from('coupons').select('*').order('created_at', { ascending: false }),
    supabase.from('courses').select('id, title').order('title'),
  ]);
  const courseName = (id: string | null) => (id ? courses?.find((c) => c.id === id)?.title ?? '—' : 'All paid courses');
  const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' }) : 'No expiry');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl">Coupons</h1>
      <form action={createCoupon} className={`${card} grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
        <Field label="Code (e.g. EID50)"><input name="code" required minLength={3} maxLength={32} placeholder="EID50" className={`${input} uppercase`} /></Field>
        <Field label="Discount type">
          <select name="kind" className={input}><option value="percent">Percent (%)</option><option value="fixed">Fixed amount (BDT)</option></select>
        </Field>
        <Field label="Discount value (50 = 50% or ৳50)"><input name="value" type="number" min="1" step="1" required className={input} /></Field>
        <Field label="Applies to">
          <select name="course_id" className={input}>
            <option value="">All paid courses</option>
            {(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </Field>
        <Field label="Total uses (empty = unlimited)"><input name="max_uses" type="number" min="1" className={input} /></Field>
        <Field label="Uses per student"><input name="per_user_limit" type="number" min="1" defaultValue="1" className={input} /></Field>
        <Field label="Last valid day (empty = no expiry)"><input name="expires" type="date" className={input} /></Field>
        <Field label="Note (only you see this)"><input name="note" maxLength={120} className={input} /></Field>
        <div className="sm:col-span-2 lg:col-span-4"><button className={btn}>Create coupon</button></div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-[#18181B] text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Applies to</th><th className="px-4 py-3">Used</th><th className="px-4 py-3">Expires</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-[#111113]">
            {(coupons ?? []).map((c) => {
              const expired = c.expires_at && new Date(c.expires_at).getTime() < nowMs();
              const spent = c.max_uses !== null && c.used_count >= c.max_uses;
              const live = c.active && !expired && !spent;
              return (
                <tr key={c.id}>
                  <td className="px-4 py-3"><span className="font-mono font-semibold text-zinc-100">{c.code}</span>{c.note && <span className="block text-xs text-zinc-500">{c.note}</span>}</td>
                  <td className="px-4 py-3">{c.kind === 'percent' ? `${Number(c.value)}%` : `৳${Number(c.value)}`}</td>
                  <td className="px-4 py-3 text-zinc-300">{courseName(c.course_id)}</td>
                  <td className="px-4 py-3">{c.used_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ''}<span className="block text-xs text-zinc-500">{c.per_user_limit} per student</span></td>
                  <td className="px-4 py-3 text-zinc-300">{fmtDate(c.expires_at)}</td>
                  <td className={`px-4 py-3 font-medium ${live ? 'text-emerald-400' : 'text-zinc-500'}`}>{live ? 'Live' : !c.active ? 'Off' : expired ? 'Expired' : 'Used up'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <form action={toggleCoupon}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="active" value={String(!c.active)} />
                        <button className={btnGhost}>{c.active ? 'Turn off' : 'Turn on'}</button>
                      </form>
                      <form action={deleteCoupon}>
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmButton className={btnDanger}>Delete</ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!coupons?.length && <tr><td colSpan={7} className="px-4 py-6 text-zinc-500">No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
