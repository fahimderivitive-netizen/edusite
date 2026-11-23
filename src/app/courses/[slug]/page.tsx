import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurriculum } from '@/lib/curriculum';
import { connection } from 'next/server';
export const instant = false
export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, description, price')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (!course) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const [modules, enrollment] = await Promise.all([
    getCurriculum(supabase, course.id),
    user
      ? supabase.from('enrollments').select('id').eq('course_id', course.id).eq('user_id', user.id).maybeSingle()
      : null,
  ]);
  const enrolled = !!enrollment?.data;

  async function enroll() {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    const { error } = await supabase.from('enrollments').insert({ user_id: user.id, course_id: course!.id });
    if (error && error.code !== '23505') throw new Error(error.message);
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{course.title}</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <p className="text-gray-600 mb-4">{course.description}</p>
        <p className="text-gray-500"><strong>Price:</strong> ${course.price}</p>
        {enrolled ? (
          <p className="mt-4 text-green-600 font-medium">You are enrolled in this course.</p>
        ) : (
          <form action={enroll}>
            <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Enroll Now
            </button>
          </form>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Course Curriculum</h2>
        {modules.map((m, i) => (
          <details key={m.id} open={i === 0} className="mb-4">
            <summary className="cursor-pointer py-2 px-4 bg-gray-100 rounded-lg font-medium">{m.title}</summary>
            <div className="ml-6 mt-2">
              {m.lessons.map((l) => (
                <div key={l.id} className="py-2 border-b last:border-0 flex justify-between items-center">
                  {enrolled || l.is_free_preview ? (
                    <Link href={`/courses/${slug}/lessons/${l.id}`} className="text-blue-600 hover:underline">{l.title}</Link>
                  ) : (
                    <span className="text-gray-500">🔒 {l.title}</span>
                  )}
                  {l.is_free_preview && (
                    <span className="px-2 py-1 text-xs text-white bg-green-500 rounded">Free Preview</span>
                  )}
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
