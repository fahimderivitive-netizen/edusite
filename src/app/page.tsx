import { connection } from 'next/server';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import CourseCard from '@/components/course/CourseCard';
export const instant = false;

export default async function Home() {
  await connection();
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from('courses')
    .select('id, slug, title, description, price, category')
    .eq('published', true)
    .order('title')
    .limit(3);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Learn Anything, Anywhere</h1>
        <p className="text-xl text-gray-600 mb-8">High-quality courses from top instructors</p>
        <Link href="/courses" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition">Browse Courses</Link>
      </div>

      {/* Featured Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {(courses ?? []).map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 py-6">
        <p>&copy; EduSite. All rights reserved.</p>
      </footer>
    </div>
  );
}
