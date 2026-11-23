import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">EduSite</Link>
        <div className="space-x-4">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <Link href="/courses" className="hover:text-blue-600">Courses</Link>
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Login/Signup</button>
        </div>
      </div>
    </nav>
  );
}