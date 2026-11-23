import { createClient } from '@/lib/supabase/server';

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type OutlineLesson = { id: string; title: string; title_bn: string | null; is_free_preview: boolean };
export type OutlineModule = { id: string; title: string; title_bn: string | null; lessons: OutlineLesson[] };

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
