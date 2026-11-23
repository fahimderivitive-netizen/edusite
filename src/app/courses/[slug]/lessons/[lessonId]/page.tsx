import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;

  // Mock course data
  const course = {
    title: 'Web Development Basics',
    modules: [
      {
        title: 'HTML Fundamentals',
        lessons: [
          { id: '1', title: 'Getting Started with HTML', isCurrent: lessonId === '1' },
          { id: '2', title: 'HTML Elements and Tags', isCurrent: lessonId === '2' },
        ],
      },
      {
        title: 'CSS Styling',
        lessons: [
          { id: '3', title: 'CSS Selectors', isCurrent: lessonId === '3' },
          { id: '4', title: 'Flexbox Layout', isCurrent: lessonId === '4' },
        ],
      },
    ],
  };

  // Find current lesson
  const currentLesson = course.modules
    .flatMap((module) => module.lessons)
    .find((lesson) => lesson.isCurrent);

  if (!currentLesson) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <div className="aspect-video bg-gray-900 flex items-center justify-center text-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Video Player Placeholder</h2>
              <p className="text-gray-400">16:9 dark video placeholder</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold mt-6 mb-4">{currentLesson.title}</h1>
          <p className="text-gray-600 mb-8">
            Short description of the lesson content and learning outcomes.
          </p>

          <div className="flex space-x-4">
            <Link
              href={`/courses/${slug}/lessons/${parseInt(lessonId) - 1}`}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >Previous Lesson</Link>
            <Link
              href={`/courses/${slug}/lessons/${parseInt(lessonId) + 1}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >Next Lesson</Link>
          </div>
        </div>

        <div className="w-full md:w-64">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Course Curriculum</h2>
            <Link
              href={`/courses/${slug}`}
              className="block mb-4 text-blue-600 hover:underline"
            >← Back to Course</Link>

            {course.modules.map((module, index) => (
              <div key={index} className="mb-6">
                <h3 className="font-medium mb-2 text-gray-700">{module.title}</h3>
                <ul className="space-y-2">
                  {module.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className={`flex items-center justify-between p-2 rounded ${
  lesson.isCurrent
    ? 'bg-blue-100 text-blue-700'
    : 'hover:bg-gray-100'
}`}
                    >
                      <span>{lesson.title}</span>
                      <span className="text-xs text-gray-500">
                        Lesson {lesson.id}
                      </span>
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