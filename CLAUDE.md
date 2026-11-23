# EduSite — Course Platform

## Tech Stack
- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Database, Auth & Storage:** Supabase (`@supabase/ssr`)
- **Math/Course Rendering:** KaTeX for equations, Markdown for lesson notes
- **Deployment:** Vercel

## Folder Structure
- `src/app/` — App Router pages (`(public)/`, `(student)/dashboard/`, `admin/`, `api/`)
- `src/components/` — Reusable UI components (`ui/`, `course/`, `lesson/`)
- `src/lib/` — Supabase clients (`supabase/client.ts`, `supabase/server.ts`), helpers

## Core Database Tables
- `profiles` (id, full_name, role: 'student' | 'admin')
- `courses` (id, slug, title, description, price, published)
- `modules` (id, course_id, title, position)
- `lessons` (id, module_id, title, video_url, content_md, pdf_url, is_free_preview, position)
- `enrollments` (id, user_id, course_id, created_at)

## Rules (Strict — Save Tokens)
- Keep code minimal and direct. No unnecessary abstractions, comments, or boilerplate.
- Never read or scan `.next/`, `node_modules/`, or lockfiles.
- Use Server Components by default; add `'use client'` only for interactive UI.
- Always enforce Supabase Row-Level Security (RLS) on every table.
- Ask before installing new npm packages.