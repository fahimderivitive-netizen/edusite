'use client';
import { useState } from 'react';
import CourseCard, { type CourseSummary } from './CourseCard';

export default function CourseList({ courses }: { courses: CourseSummary[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const categories = [...new Set(courses.map((c) => c.category).filter(Boolean))] as string[];

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'all' || c.category === category)
  );

  return (
    <>
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
          className="px-4 py-2 border rounded-lg capitalize"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </>
  );
}
