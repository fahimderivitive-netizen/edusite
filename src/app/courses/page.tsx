import { createClient } from '@/lib/supabase/server';
import CourseList from '@/components/course/CourseList';
import { connection } from 'next/server';

export default async function Courses() {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
  .from('courses')
  .select('id, slug, title, description, price, category')
  .eq('published', true)
  .order('title');

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl">Course Catalog</h1>
      <p className="mb-8 mt-2 text-zinc-400">Find the right course and start learning today.</p>
      <CourseList courses={data ?? []} />
    </div>
  );
}
