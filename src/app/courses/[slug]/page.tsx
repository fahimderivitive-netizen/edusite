'use client';
import { use, useState } from 'react';

export default function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  // Mock course data
  const course = {
    title: 'Web Development Basics',
    description: 'Learn HTML, CSS, and JavaScript fundamentals',
    instructor: 'Jane Doe',
    price: 99,
    curriculum: [
      {
        title: 'HTML Fundamentals',
        lessons: [
          {
            title: 'Getting Started with HTML',
            duration: '15:00',
            isFree: true,
            path: `/courses/${slug}/lessons/1`,
          },
          {
            title: 'HTML Elements and Tags',
            duration: '20:00',
          },
        ],
      },
      {
        title: 'CSS Styling',
        lessons: [
          {
            title: 'CSS Selectors',
            duration: '18:00',
          },
          {
            title: 'Flexbox Layout',
            duration: '25:00',
          },
        ],
      },
    ],
  };

  const [activeModule, setActiveModule] = useState(0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{course.title}</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <p className="text-gray-600 mb-4">{course.description}</p>
       <p className="text-gray-500"><strong>Instructor:</strong> {course.instructor}</p>
<p className="text-gray-500"><strong>Price:</strong> ${course.price}</p>
        <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          Enroll Now
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Course Curriculum</h2>

        {course.curriculum.map((module, index) => (
          <div key={index} className="mb-4">
            <button
              className="w-full text-left py-2 px-4 bg-gray-100 rounded-lg flex justify-between items-center"
              onClick={() => setActiveModule(index === activeModule ? -1 : index)}
            >
              <span className="font-medium">{module.title}</span>
              <span>
                {index === activeModule ? '▼' : '▶'}
              </span>
            </button>

            {index === activeModule && (
              <div className="ml-6 mt-2">
                {module.lessons.map((lesson, lessonIndex) => (
                  <div key={lessonIndex} className="py-2 border-b last:border-0">
                    <div className="flex justify-between items-center">
                      <span>{lesson.title}</span>
                      <span className="text-sm text-gray-500">{lesson.duration}</span>
                    </div>

                    {lesson.isFree && (
                      <span className="mt-1 inline-block px-2 py-1 text-xs text-white bg-green-500 rounded">
                        Free Preview
                      </span>
                    )}

                    {lesson.path && (
                      <a href={lesson.path} className="mt-1 text-blue-600 text-sm hover:underline">
                        Preview Lesson
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}