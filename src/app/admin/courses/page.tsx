import Link from 'next/link';
import { connection } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createCourse } from '../actions';
import { Field, btn, card, input } from '@/components/admin/ui';
export const instant = false;

export default async function AdminCourses() {
  await connection();
  await requireStaff('content');
  const supabase = await createClient();
  const { data: courses } = await supabase.from('courses').select('id, slug, title, price, published, category').order('title');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl">Courses</h1>
      <form action={createCourse} className={`${card} grid gap-4 sm:grid-cols-2 lg:grid-cols-5`}>
        <Field label="Title" className="lg:col-span-2"><input name="title" required className={input} /></Field>
        <Field label="Slug (url)"><input name="slug" required placeholder="my-course" className={input} /></Field>
        <Field label="Price (BDT, 0 = free)"><input name="price" type="number" min="0" step="1" defaultValue="0" className={input} /></Field>
        <Field label="Category"><input name="category" placeholder="development" className={input} /></Field>
        <div className="sm:col-span-2 lg:col-span-5"><button className={btn}>Create course</button></div>
      </form>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-[#18181B] text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr><th className="px-4 py-3">Course</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-[#111113]">
            {(courses ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3"><Link href={`/admin/courses/${c.id}`} className="font-medium text-zinc-100 hover:text-emerald-400">{c.title}</Link><span className="ml-2 text-xs text-zinc-500">/{c.slug}</span></td>
                <td className="px-4 py-3 text-zinc-300">{Number(c.price) === 0 ? 'Free' : `৳${c.price}`}</td>
                <td className="px-4 py-3">{c.published ? <span className="text-emerald-400">Published</span> : <span className="text-zinc-500">Draft</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
