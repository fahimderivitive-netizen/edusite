'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireStaff, requireUser } from '@/lib/auth';
import { parse, opt } from '@/lib/validate';
import { limit } from '@/lib/ratelimit';

const id = z.guid();
const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };
const ownPath = (uid: string, p: string | null) => {
  if (p && !p.startsWith(`${uid}/`)) throw new Error('Invalid file path');
  return p;
};
const throttle = async (key: string, max: number, sec: number) => {
  if (!(await limit(key, max, sec))) throw new Error('Too many requests. Please slow down.');
};

export async function toggleComplete(fd: FormData) {
  const user = await requireUser();
  const v = parse(z.object({ lesson_id: id, slug: z.string().max(200) }), fd);
  const supabase = await createClient();
  const { data: row } = await supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id).eq('lesson_id', v.lesson_id).maybeSingle();
  if (row) fail((await supabase.from('lesson_progress').delete().eq('user_id', user.id).eq('lesson_id', v.lesson_id)).error);
  else fail((await supabase.from('lesson_progress').insert({ user_id: user.id, lesson_id: v.lesson_id })).error);
  revalidatePath(`/courses/${v.slug}/lessons/${v.lesson_id}`);
}

export async function postComment(fd: FormData) {
  const user = await requireUser();
  const v = parse(z.object({ lesson_id: id, slug: z.string().max(200), parent_id: z.string().optional(), body: z.string().trim().min(1).max(2000) }), fd);
  await throttle(`comment:${user.id}`, 10, 60);
  const m = v.body.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).match(/(?<!\d)(\d{1,2}):(\d{2})(?!\d)/);
  const supabase = await createClient();
  fail((await supabase.from('lesson_comments').insert({
    lesson_id: v.lesson_id, user_id: user.id, parent_id: v.parent_id || null, body: v.body,
    video_ts_sec: m ? Number(m[1]) * 60 + Number(m[2]) : null,
  })).error);
  revalidatePath(`/courses/${v.slug}/lessons/${v.lesson_id}`);
}

export async function deleteComment(fd: FormData) {
  await requireUser();
  const v = parse(z.object({ id, lesson_id: id, slug: z.string().max(200) }), fd);
  const supabase = await createClient();
  fail((await supabase.from('lesson_comments').delete().eq('id', v.id)).error); // RLS: own, or qna staff
  revalidatePath(`/courses/${v.slug}/lessons/${v.lesson_id}`);
}

const media = { body: z.string().trim().max(4000).default(''), image_path: opt, audio_path: opt };

export async function createDoubt(fd: FormData) {
  const user = await requireUser();
  const v = parse(z.object({ ...media, lesson_id: z.string().optional() }), fd);
  if (!v.body && !v.image_path && !v.audio_path) throw new Error('Write something or attach a photo or voice note');
  await throttle(`doubt:${user.id}`, 10, 600);
  const supabase = await createClient();
  const { data, error } = await supabase.from('doubts').insert({
    user_id: user.id, lesson_id: v.lesson_id || null, body: v.body,
    image_path: ownPath(user.id, v.image_path), audio_path: ownPath(user.id, v.audio_path),
  }).select('id').single();
  fail(error);
  redirect(`/doubts/${data!.id}`);
}

export async function replyDoubt(fd: FormData) {
  const user = await requireUser();
  const v = parse(z.object({ ...media, doubt_id: id }), fd);
  if (!v.body && !v.image_path && !v.audio_path) throw new Error('Write something or attach a photo or voice note');
  await throttle(`reply:${user.id}`, 20, 600);
  const supabase = await createClient();
  fail((await supabase.from('doubt_replies').insert({
    doubt_id: v.doubt_id, user_id: user.id, body: v.body,
    image_path: ownPath(user.id, v.image_path), audio_path: ownPath(user.id, v.audio_path),
  })).error);
  revalidatePath(`/doubts/${v.doubt_id}`);
  revalidatePath(`/admin/doubts/${v.doubt_id}`);
}

export async function setDoubtStatus(fd: FormData) {
  await requireStaff('qna');
  const v = parse(z.object({ id, status: z.enum(['open', 'answered', 'closed']) }), fd);
  const supabase = await createClient();
  fail((await supabase.from('doubts').update({ status: v.status, updated_at: new Date().toISOString() }).eq('id', v.id)).error);
  revalidatePath(`/admin/doubts/${v.id}`);
  revalidatePath(`/doubts/${v.id}`);
}

export async function createTicket(fd: FormData) {
  const user = await requireUser();
  const v = parse(z.object({ subject: z.string().trim().min(3).max(200), message: z.string().trim().min(1).max(4000) }), fd);
  await throttle(`ticket:${user.id}`, 5, 600);
  const supabase = await createClient();
  const { data, error } = await supabase.from('tickets').insert({ user_id: user.id, subject: v.subject }).select('id').single();
  fail(error);
  fail((await supabase.from('ticket_messages').insert({ ticket_id: data!.id, user_id: user.id, body: v.message })).error);
  redirect(`/support/${data!.id}`);
}

export async function replyTicket(fd: FormData) {
  const user = await requireUser();
  const v = parse(z.object({ ticket_id: id, body: z.string().trim().min(1).max(4000) }), fd);
  await throttle(`tmsg:${user.id}`, 20, 600);
  const supabase = await createClient();
  fail((await supabase.from('ticket_messages').insert({ ticket_id: v.ticket_id, user_id: user.id, body: v.body })).error);
  revalidatePath(`/support/${v.ticket_id}`);
  revalidatePath(`/admin/tickets/${v.ticket_id}`);
}

export async function updateTicket(fd: FormData) {
  const s = await requireStaff('support');
  const v = parse(z.object({ id, status: z.enum(['open', 'in_progress', 'resolved']), assign: z.string().optional() }), fd);
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status: v.status, updated_at: new Date().toISOString() };
  if (v.assign === 'me') patch.assignee_id = s.id;
  if (v.assign === 'none') patch.assignee_id = null;
  fail((await supabase.from('tickets').update(patch).eq('id', v.id)).error);
  revalidatePath(`/admin/tickets/${v.id}`);
  revalidatePath(`/support/${v.id}`);
}
