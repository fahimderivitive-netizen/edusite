import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { deleteRow, saveLesson, saveModule, updateCourse } from '../../actions';
import ConfirmButton from '@/components/admin/ConfirmButton';
import { thumbUrl } from '@/lib/thumb';
import { Field, btn, btnDanger, btnGhost, card, input } from '@/components/admin/ui';
export const instant = false;

function DeleteForm({ table, id, courseId }: { table: string; id: string; courseId: string }) {
  return (
    <form action={deleteRow}>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="course_id" value={courseId} />
      <ConfirmButton className={btnDanger}>Delete</ConfirmButton>
    </form>
  );
}

export default async function EditCourse({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requireStaff('content');
  const { id } = await params;
  const supabase = await createClient();

  const { data: c } = await supabase.from('courses').select('*').eq('id', id).maybeSingle();
  if (!c) notFound();
  const { data: modules } = await supabase.from('modules').select('*').eq('course_id', id).order('position');
  const moduleIds = (modules ?? []).map((m) => m.id);
  const { data: lessons } = await supabase.from('lessons').select('*').in('module_id', moduleIds).order('position');
  const { data: media } = await supabase.from('lesson_media').select('*').in('lesson_id', (lessons ?? []).map((l) => l.id));
  const mediaOf = (lid: string) => media?.find((m) => m.lesson_id === lid);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">{c.title}</h1>
        <div className="flex gap-2">
          <Link href={`/courses/${c.slug}`} className={btnGhost}>View public page</Link>
          <DeleteForm table="courses" id={c.id} courseId={c.id} />
        </div>
      </div>

      <form action={updateCourse} className={`${card} grid gap-4 sm:grid-cols-2`}>
        <input type="hidden" name="id" value={c.id} />
        <Field label="Title (English)"><input name="title" required defaultValue={c.title} className={input} /></Field>
        <Field label="Title (বাংলা)"><input name="title_bn" defaultValue={c.title_bn ?? ''} className={input} /></Field>
        <Field label="Description (English)"><textarea name="description" rows={3} defaultValue={c.description ?? ''} className={input} /></Field>
        <Field label="Description (বাংলা)"><textarea name="description_bn" rows={3} defaultValue={c.description_bn ?? ''} className={input} /></Field>
        <Field label="Slug"><input name="slug" required defaultValue={c.slug} className={input} /></Field>
        <Field label="Price (BDT, 0 = free)"><input name="price" type="number" min="0" defaultValue={c.price} className={input} /></Field>
        <Field label="Category"><input name="category" defaultValue={c.category ?? ''} className={input} /></Field>
        <Field label="Instructor name (shown on the card)"><input name="instructor_name" maxLength={80} defaultValue={c.instructor_name ?? ''} placeholder="e.g. Fahim" className={input} /></Field>
        <Field label="Original price (BDT, optional: shows a crossed-out price and % off)"><input name="original_price" type="number" min="0" defaultValue={c.original_price ?? ''} placeholder="e.g. 999" className={input} /></Field>
        <div className="sm:col-span-2">
          <Field label="Course picture (16:9, e.g. 1280×720, PNG/JPG/WebP, max 2 MB)">
            <input name="thumbnail" type="file" accept="image/png,image/jpeg,image/webp" className={input} />
          </Field>
          {c.thumbnail_path && (
            <div className="mt-3 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbUrl(c.thumbnail_path)} alt="" className="h-20 w-36 rounded-lg border border-white/10 object-cover" />
              <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" name="remove_thumbnail" className="h-4 w-4 accent-red-400" /> Remove picture</label>
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-zinc-300">
          <input type="checkbox" name="published" defaultChecked={c.published} className="h-4 w-4 accent-emerald-400" /> Published
        </label>
        <div className="sm:col-span-2"><button className={btn}>Save course</button></div>
      </form>

      <section className="space-y-4">
        <h2 className="text-xl">Curriculum</h2>
        {(modules ?? []).map((m) => (
          <div key={m.id} className={`${card} space-y-4`}>
            <form action={saveModule} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="course_id" value={id} />
              <Field label="Module title"><input name="title" required defaultValue={m.title} className={input} /></Field>
              <Field label="শিরোনাম (বাংলা)"><input name="title_bn" defaultValue={m.title_bn ?? ''} className={input} /></Field>
              <Field label="Order"><input name="position" type="number" min="0" defaultValue={m.position} className={`${input} w-20`} /></Field>
              <button className={btnGhost}>Save module</button>
            </form>
            <DeleteForm table="modules" id={m.id} courseId={id} />

            <div className="space-y-2">
              {(lessons ?? []).filter((l) => l.module_id === m.id).map((l) => {
                const lm = mediaOf(l.id);
                return (
                  <details key={l.id} className="rounded-lg border border-white/10 bg-[#09090B]">
                    <summary className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm">
                      <span className="flex-1 text-zinc-100">{l.title}</span>
                      <span className="text-xs text-zinc-500">{l.content_type}</span>
                      {l.is_free_preview && <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">free</span>}
                    </summary>
                    <div className="space-y-3 border-t border-white/10 p-4">
                      <LessonForm moduleId={m.id} courseId={id} lesson={l} videoId={lm?.video_id ?? ''} hasPdf={!!lm?.pdf_path} />
                      <DeleteForm table="lessons" id={l.id} courseId={id} />
                    </div>
                  </details>
                );
              })}
              <details className="rounded-lg border border-dashed border-white/10">
                <summary className="cursor-pointer px-4 py-3 text-sm text-emerald-400">+ Add lesson</summary>
                <div className="border-t border-white/10 p-4"><LessonForm moduleId={m.id} courseId={id} /></div>
              </details>
            </div>
          </div>
        ))}

        <form action={saveModule} className={`${card} flex flex-wrap items-end gap-3`}>
          <input type="hidden" name="course_id" value={id} />
          <Field label="New module title"><input name="title" required className={input} /></Field>
          <Field label="শিরোনাম (বাংলা)"><input name="title_bn" className={input} /></Field>
          <Field label="Order"><input name="position" type="number" min="0" defaultValue={(modules?.length ?? 0) + 1} className={`${input} w-20`} /></Field>
          <button className={btn}>Add module</button>
        </form>
      </section>
    </div>
  );
}

type LessonRow = {
  id: string; title: string; title_bn: string | null; content_type: string; position: number;
  duration_sec: number | null; is_free_preview: boolean; content_md: string | null;
};

function LessonForm({ moduleId, courseId, lesson, videoId = '', hasPdf = false }: {
  moduleId: string; courseId: string; lesson?: LessonRow; videoId?: string; hasPdf?: boolean;
}) {
  return (
    <form action={saveLesson} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <input type="hidden" name="id" value={lesson?.id ?? ''} />
      <input type="hidden" name="module_id" value={moduleId} />
      <input type="hidden" name="course_id" value={courseId} />
      <Field label="Title"><input name="title" required defaultValue={lesson?.title} className={input} /></Field>
      <Field label="শিরোনাম (বাংলা)"><input name="title_bn" defaultValue={lesson?.title_bn ?? ''} className={input} /></Field>
      <Field label="Type">
        <select name="content_type" defaultValue={lesson?.content_type ?? 'video'} className={input}>
          <option value="video">Video only</option>
          <option value="video_pdf">Video + PDF</option>
          <option value="pdf">PDF only</option>
          <option value="text">Text only</option>
        </select>
      </Field>
      <Field label="Order"><input name="position" type="number" min="0" defaultValue={lesson?.position ?? 0} className={input} /></Field>
      <Field label="Duration (minutes)"><input name="duration_min" type="number" min="0" step="0.5" defaultValue={lesson?.duration_sec ? lesson.duration_sec / 60 : 0} className={input} /></Field>
      <Field label="Video: Bunny ID, or YouTube link (free previews only)"><input name="video_id" defaultValue={videoId} placeholder="e.g. 3f2c… or https://youtu.be/…" className={input} /></Field>
      <Field label={hasPdf ? 'Replace PDF (25 MB max)' : 'PDF (25 MB max)'}><input name="pdf" type="file" accept="application/pdf" className={input} /></Field>
      <div className="flex items-end gap-4 pb-2 text-sm text-zinc-300">
        <label className="flex items-center gap-2"><input type="checkbox" name="is_free_preview" defaultChecked={lesson?.is_free_preview} className="h-4 w-4 accent-emerald-400" /> Free preview</label>
        {hasPdf && <label className="flex items-center gap-2"><input type="checkbox" name="remove_pdf" className="h-4 w-4 accent-red-400" /> Remove PDF</label>}
      </div>
      <Field label="Notes (Markdown, KaTeX: $x^2$)" className="sm:col-span-2 lg:col-span-3"><textarea name="content_md" rows={4} defaultValue={lesson?.content_md ?? ''} className={input} /></Field>
      <div className="sm:col-span-2 lg:col-span-3"><button className={btn}>{lesson ? 'Save lesson' : 'Add lesson'}</button></div>
    </form>
  );
}
