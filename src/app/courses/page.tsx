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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Course Catalog</h1>
      <CourseList courses={data ?? []} />
    </div>
  );
}
