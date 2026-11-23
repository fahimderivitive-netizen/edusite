import Link from 'next/link';

export type CourseSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
};

export default function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
      <p className="text-gray-600 mb-4">{course.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-gray-500">${course.price}</span>
        <Link href={`/courses/${course.slug}`} className="text-blue-600 hover:underline">View Course</Link>
      </div>
    </div>
  );
}
