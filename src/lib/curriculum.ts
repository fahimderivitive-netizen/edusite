import { createClient } from '@/lib/supabase/server';

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type OutlineLesson = { id: string; title: string; title_bn: string | null; is_free_preview: boolean };
export type OutlineModule = { id: string; title: string; title_bn: string | null; lessons: OutlineLesson[] };

export type CourseStats = { lessons: number; seconds: number };

// Lesson count and total video length per course, for the course cards (published courses only, via the public outline view).
export async function getCourseStats(supabase: Supabase, courseIds: string[]): Promise<Record<string, CourseStats>> {
  if (!courseIds.length) return {};
  const { data: mods } = await supabase.from('modules').select('id, course_id').in('course_id', courseIds);
  const owner = new Map((mods ?? []).map((m) => [m.id, m.course_id as string]));
  const { data: ls } = await supabase.from('lesson_outline').select('module_id, duration_sec').in('module_id', [...owner.keys()]);
  const stats: Record<string, CourseStats> = {};
  for (const l of ls ?? []) {
    const cid = owner.get(l.module_id);
    if (!cid) continue;
    const s = (stats[cid] ??= { lessons: 0, seconds: 0 });
    s.lessons += 1;
    s.seconds += Number(l.duration_sec ?? 0);
  }
  return stats;
}

export async function getCurriculum(supabase: Supabase, courseId: string): Promise<OutlineModule[]> {
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, title_bn')
    .eq('course_id', courseId)
    .order('position');
  const ids = (modules ?? []).map((m) => m.id);
  const { data: lessons } = await supabase
    .from('lesson_outline')
    .select('id, module_id, title, title_bn, is_free_preview')
    .in('module_id', ids)
    .order('position');
  return (modules ?? []).map((m) => ({
    ...m,
    lessons: (lessons ?? []).filter((l) => l.module_id === m.id),
  }));
}
