import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurriculum } from '@/lib/curriculum';
import { connection } from 'next/server';
export const instant = false

export default async function LessonPage({

  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
    await connection();
  const { slug, lessonId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (!course) notFound();

  const modules = await getCurriculum(supabase, course.id);
  const flat = modules.flatMap((m) => m.lessons);
  const index = flat.findIndex((l) => l.id === lessonId);
  if (index < 0) notFound();

  // RLS returns the row only for free previews or enrolled users.
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, video_url, content_md')
    .eq('id', lessonId)
    .maybeSingle();

  const prev = flat[index - 1];
  const next = flat[index + 1];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          {!lesson ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <h1 className="text-2xl font-bold mb-2">🔒 {flat[index].title}</h1>
              <p className="text-gray-600 mb-4">Enroll in this course to unlock this lesson.</p>
              <Link href={`/courses/${slug}`} className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Back to course
              </Link>
            </div>
          ) : (
            <>
              {lesson.video_url ? (
                <video controls src={lesson.video_url} className="aspect-video w-full bg-gray-900" />
              ) : (
                <div className="aspect-video bg-gray-900 flex items-center justify-center text-gray-400">No video</div>
              )}
              <h1 className="text-3xl font-bold mt-6 mb-4">{lesson.title}</h1>
              <div className="text-gray-600 mb-8 whitespace-pre-wrap">{lesson.content_md}</div>
              <div className="flex space-x-4">
                {prev && (
                  <Link href={`/courses/${slug}/lessons/${prev.id}`} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                    Previous Lesson
                  </Link>
                )}
                {next && (
                  <Link href={`/courses/${slug}/lessons/${next.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Next Lesson
                  </Link>
                )}
              </div>
            </>
          )}
        </div>

        <div className="w-full md:w-64">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">{course.title}</h2>
            <Link href={`/courses/${slug}`} className="block mb-4 text-blue-600 hover:underline">← Back to Course</Link>
            {modules.map((m) => (
              <div key={m.id} className="mb-6">
                <h3 className="font-medium mb-2 text-gray-700">{m.title}</h3>
                <ul className="space-y-2">
                  {m.lessons.map((l) => (
                    <li key={l.id}>
                      <Link
                        href={`/courses/${slug}/lessons/${l.id}`}
                        className={`block p-2 rounded ${l.id === lessonId ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                      >
                        {l.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
