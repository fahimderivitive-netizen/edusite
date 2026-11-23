import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { connection } from 'next/server';

async function logout() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export default async function Navbar() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">EduSite</Link>
        <div className="flex items-center space-x-4">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <Link href="/courses" className="hover:text-blue-600">Courses</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
              <form action={logout}>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Logout</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Login/Signup</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
