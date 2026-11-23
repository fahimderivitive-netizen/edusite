'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { parse } from '@/lib/validate';

export async function startExam(fd: FormData) {
  const user = await requireUser();
  const { exam_id } = parse(z.object({ exam_id: z.uuid() }), fd);
  const supabase = await createClient();
  const { error } = await supabase.from('exam_attempts').insert({ exam_id, user_id: user.id });
  if (error && error.code !== '23505') throw new Error(error.message); // 23505: already started, just resume
  redirect(`/exams/${exam_id}/take`);
}

const submission = z.object({
  attemptId: z.uuid(),
  examId: z.uuid(),
  answers: z.record(z.uuid(), z.number().int().min(0).max(50)),
  text: z.string().max(20000),
  path: z.string().max(300).nullable(),
});

// Grading happens in the submit_exam database function (keys never leave the database).
export async function submitExam(input: z.input<typeof submission>) {
  await requireUser();
  const v = submission.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_exam', {
    p_attempt: v.attemptId, p_answers: v.answers, p_text: v.text || null, p_path: v.path,
  });
  if (error && !error.message.includes('Already submitted')) throw new Error(error.message);
  redirect(`/exams/${v.examId}/result`);
}
