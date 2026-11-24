import { createClient } from '@/lib/supabase/server';
import CourseList from '@/components/course/CourseList';
import { connection } from 'next/server';
import { getT } from '@/lib/i18n/server';
export const instant = false;

export default async function Courses() {
  await connection();
  const { lang, t } = await getT();
  const supabase = await createClient();
  const { data } = await supabase
  .from('courses')
  .select('id, slug, title, title_bn, description, description_bn, price, category')
  .eq('published', true)
  .order('title');

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl">{t.courses.title}</h1>
      <p className="mb-8 mt-2 text-zinc-400">{t.courses.sub}</p>
      <CourseList courses={data ?? []} lang={lang} />
    </div>
  );
}
