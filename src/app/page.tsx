import Link from 'next/link';
export default function Home() {
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Course Title {i}</h3>
            <p className="text-gray-600 mb-4">Short description of course {i} content and learning outcomes.</p>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">$99</span>
              <Link href={`/courses/${i}`} className="text-blue-600 hover:underline">View Course</Link>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 py-6">
        <p>&copy; 2026 EduSite. All rights reserved.</p>
      </footer>
    </div>
  );
}
