'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireStaff, requireAdmin } from '@/lib/auth';
import { parse, opt, bool, int } from '@/lib/validate';

const id = z.uuid();
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug: lowercase letters, numbers and dashes only');
const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };

const courseFields = {
  title: z.string().trim().min(1, 'Title is required'),
  title_bn: opt,
  description: opt,
  description_bn: opt,
  slug,
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  category: opt,
};

export async function createCourse(fd: FormData) {
  await requireStaff('content');
  const v = parse(z.object({ title: courseFields.title, slug, price: courseFields.price, category: opt }), fd);
  const supabase = await createClient();
  const { data, error } = await supabase.from('courses').insert({ ...v, published: false }).select('id').single();
  fail(error);
  redirect(`/admin/courses/${data!.id}`);
}

export async function updateCourse(fd: FormData) {
  await requireStaff('content');
  const { id: courseId, published, ...v } = parse(z.object({ id, ...courseFields, published: bool }), fd);
  const supabase = await createClient();
  fail((await supabase.from('courses').update({ ...v, published }).eq('id', courseId)).error);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function saveModule(fd: FormData) {
  await requireStaff('content');
  const v = parse(z.object({
    id: z.string().optional(), course_id: id,
    title: z.string().trim().min(1, 'Module title is required'), title_bn: opt, position: int,
  }), fd);
  const supabase = await createClient();
  const { id: moduleId, ...row } = v;
  fail((moduleId ? await supabase.from('modules').update(row).eq('id', moduleId) : await supabase.from('modules').insert(row)).error);
  revalidatePath(`/admin/courses/${v.course_id}`);
}

export async function saveLesson(fd: FormData) {
  await requireStaff('content');
  const v = parse(z.object({
    id: z.string().optional(), module_id: id, course_id: id,
    title: z.string().trim().min(1, 'Lesson title is required'), title_bn: opt,
    content_type: z.enum(['video', 'video_pdf', 'pdf', 'text']),
    position: int, duration_min: z.coerce.number().min(0).default(0),
    is_free_preview: bool, content_md: opt, video_id: opt, remove_pdf: bool,
  }), fd);
  const supabase = await createClient();

  const row = {
    module_id: v.module_id, title: v.title, title_bn: v.title_bn, content_type: v.content_type,
    position: v.position, duration_sec: Math.round(v.duration_min * 60) || null,
    is_free_preview: v.is_free_preview, content_md: v.content_md,
  };
  let lessonId = v.id || '';
  if (lessonId) fail((await supabase.from('lessons').update(row).eq('id', lessonId)).error);
  else {
    const { data, error } = await supabase.from('lessons').insert(row).select('id').single();
    fail(error);
    lessonId = data!.id;
  }

  const { data: media } = await supabase.from('lesson_media').select('pdf_path').eq('lesson_id', lessonId).maybeSingle();
  let pdfPath: string | null = media?.pdf_path ?? null;
  const file = fd.get('pdf');
  if (file instanceof File && file.size > 0) {
    if (file.type !== 'application/pdf') throw new Error('Only PDF files are allowed');
    if (file.size > 25 * 1024 * 1024) throw new Error('PDF must be 25 MB or smaller');
    const path = `${v.course_id}/${lessonId}/${Date.now()}.pdf`;
    fail((await supabase.storage.from('lecture-pdfs').upload(path, file, { contentType: 'application/pdf' })).error);
    if (pdfPath) await supabase.storage.from('lecture-pdfs').remove([pdfPath]);
    pdfPath = path;
  } else if (v.remove_pdf && pdfPath) {
    await supabase.storage.from('lecture-pdfs').remove([pdfPath]);
    pdfPath = null;
  }
  fail((await supabase.from('lesson_media').upsert({ lesson_id: lessonId, video_id: v.video_id, pdf_path: pdfPath })).error);
  revalidatePath(`/admin/courses/${v.course_id}`);
}

export async function deleteRow(fd: FormData) {
  await requireStaff('content');
  const v = parse(z.object({ table: z.enum(['courses', 'modules', 'lessons']), id, course_id: z.string().optional() }), fd);
  const supabase = await createClient();
  if (v.table === 'lessons') {
    const { data: m } = await supabase.from('lesson_media').select('pdf_path').eq('lesson_id', v.id).maybeSingle();
    if (m?.pdf_path) await supabase.storage.from('lecture-pdfs').remove([m.pdf_path]);
  }
  fail((await supabase.from(v.table).delete().eq('id', v.id)).error);
  if (v.table === 'courses') redirect('/admin/courses');
  revalidatePath(`/admin/courses/${v.course_id}`);
}

export async function setRole(fd: FormData) {
  const me = await requireAdmin();
  const v = parse(z.object({ user_id: id, role: z.enum(['student', 'moderator', 'admin']) }), fd);
  if (v.user_id === me.id) throw new Error('You cannot change your own role');
  const scopes = fd.getAll('scopes').map(String).filter((s) => ['content', 'qna', 'support'].includes(s));
  const supabase = await createClient();
  fail((await supabase.from('profiles').update({ role: v.role, mod_scopes: v.role === 'moderator' ? scopes : [] }).eq('id', v.user_id)).error);
  revalidatePath('/admin/users');
}

export async function enrollUser(fd: FormData) {
  await requireAdmin();
  const v = parse(z.object({ user_id: id, course_id: id }), fd);
  const supabase = await createClient();
  const { error } = await supabase.from('enrollments').insert({ ...v, source: 'admin' });
  if (error && error.code !== '23505') throw new Error(error.message);
  revalidatePath('/admin/users');
}

export async function revokeEnrollment(fd: FormData) {
  await requireAdmin();
  const v = parse(z.object({ id }), fd);
  const supabase = await createClient();
  fail((await supabase.from('enrollments').delete().eq('id', v.id)).error);
  revalidatePath('/admin/users');
}
