'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/auth';
import { parse, opt, bool, int } from '@/lib/validate';

const id = z.uuid();
const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };
const examFields = {
  course_id: id,
  title: z.string().trim().min(1, 'Title is required'),
  title_bn: opt,
  kind: z.enum(['mcq', 'written']),
  duration_min: z.coerce.number().int().min(1).max(600),
  negative_mark: z.coerce.number().min(0).max(1).default(0),
  instructions: opt,
};

export async function createExam(fd: FormData) {
  await requireStaff('content');
  const v = parse(z.object(examFields), fd);
  const supabase = await createClient();
  const { data, error } = await supabase.from('exams').insert({ ...v, published: false }).select('id').single();
  fail(error);
  redirect(`/admin/exams/${data!.id}`);
}

export async function updateExam(fd: FormData) {
  await requireStaff('content');
  const { id: examId, published, ...v } = parse(z.object({ id, ...examFields, published: bool }), fd);
  const supabase = await createClient();
  fail((await supabase.from('exams').update({ ...v, published }).eq('id', examId)).error);
  revalidatePath(`/admin/exams/${examId}`);
}

export async function deleteExam(fd: FormData) {
  await requireStaff('content');
  const v = parse(z.object({ id }), fd);
  const supabase = await createClient();
  fail((await supabase.from('exams').delete().eq('id', v.id)).error);
  redirect('/admin/exams');
}

const lines = (s: string | null) => (s ?? '').split('\n').map((x) => x.trim()).filter(Boolean);

export async function saveQuestion(fd: FormData) {
  await requireStaff('content');
  const v = parse(z.object({
    id: z.string().optional(), exam_id: id,
    body: z.string().trim().min(1, 'Question text is required'), body_bn: opt,
    options_en: opt, options_bn: opt, correct: z.coerce.number().int().min(0).default(0),
    marks: z.coerce.number().positive().default(1), position: int, solution: opt, solution_bn: opt,
  }), fd);
  const supabase = await createClient();
  const { data: exam } = await supabase.from('exams').select('kind').eq('id', v.exam_id).maybeSingle();
  if (!exam) throw new Error('Exam not found');

  let options: { en: string; bn: string | null }[] | null = null;
  if (exam.kind === 'mcq') {
    const en = lines(v.options_en);
    const bn = lines(v.options_bn);
    if (en.length < 2) throw new Error('MCQ needs at least 2 options (one per line)');
    if (v.correct < 1 || v.correct > en.length) throw new Error(`Correct answer must be a number from 1 to ${en.length}`);
    options = en.map((o, i) => ({ en: o, bn: bn[i] || null }));
  }
  const row = { exam_id: v.exam_id, body: v.body, body_bn: v.body_bn, options, marks: v.marks, position: v.position };
  let qid = v.id || '';
  if (qid) fail((await supabase.from('exam_questions').update(row).eq('id', qid)).error);
  else {
    const { data, error } = await supabase.from('exam_questions').insert(row).select('id').single();
    fail(error);
    qid = data!.id;
  }
  fail((await supabase.from('exam_keys').upsert({
    question_id: qid, correct: exam.kind === 'mcq' ? v.correct - 1 : null, solution: v.solution, solution_bn: v.solution_bn,
  })).error);
  revalidatePath(`/admin/exams/${v.exam_id}`);
}

export async function deleteQuestion(fd: FormData) {
  await requireStaff('content');
  const v = parse(z.object({ id, exam_id: id }), fd);
  const supabase = await createClient();
  fail((await supabase.from('exam_questions').delete().eq('id', v.id)).error);
  revalidatePath(`/admin/exams/${v.exam_id}`);
}

export async function gradeAttempt(fd: FormData) {
  await requireStaff('content');
  const v = parse(z.object({ id, exam_id: id, score: z.coerce.number().min(0), feedback: opt }), fd);
  const supabase = await createClient();
  fail((await supabase.from('exam_attempts').update({ score: v.score, feedback: v.feedback, status: 'graded' }).eq('id', v.id)).error);
  revalidatePath(`/admin/exams/${v.exam_id}`);
}
