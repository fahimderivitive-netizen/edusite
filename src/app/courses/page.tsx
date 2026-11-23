'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Courses() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const courses = [
    {
      id: 1,
      title: 'Web Development Basics',
      description: 'Learn HTML, CSS, and JavaScript fundamentals',
      price: 99,
      modules: 12,
      category: 'development',
    },
    {
      id: 2,
      title: 'Data Science with Python',
      description: 'Python for data analysis and visualization',
      price: 149,
      modules: 15,
      category: 'data',
    },
    {
      id: 3,
      title: 'UX Design Principles',
      description: 'Create user-centered digital experiences',
      price: 79,
      modules: 8,
      category: 'design',
    },
  ];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || course.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Course Catalog</h1>

      {/* Search and Filter */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full md:w-64"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Categories</option>
          <option value="development">Development</option>
          <option value="data">Data</option>
          <option value="design">Design</option>
        </select>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
            <p className="text-gray-600 mb-4">{course.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">${course.price}</span>
              <Link href={`/courses/${course.id}`} className="text-blue-600 hover:underline">View Course</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
