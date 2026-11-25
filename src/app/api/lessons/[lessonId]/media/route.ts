import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, hasServiceKey } from '@/lib/supabase/admin';
import { ensureDevice } from '@/lib/device';
import { limit } from '@/lib/ratelimit';
import { signVideo } from '@/lib/media';
import { parseYouTubeId } from '@/lib/youtube';

const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (!(await limit(`media:${user.id}`, 60, 60))) return json({ error: 'rate_limited' }, 429);

  // RLS is the access check: a row comes back only for free previews, enrolled students and content staff.
  const { data: lesson } = await supabase.from('lessons').select('id, is_free_preview').eq('id', lessonId).maybeSingle();
  if (!lesson) return json({ error: 'forbidden' }, 403);
  if (!hasServiceKey()) return json({ error: 'not_configured' }, 503);

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role === 'student' && (await ensureDevice(user.id)) === 'revoked') return json({ error: 'device_limit' }, 403);

  const admin = createAdminClient();
  const { data: m, error: mediaErr } = await admin.from('lesson_media').select('video_id, pdf_path').eq('lesson_id', lessonId).maybeSingle();
  if (mediaErr) {
    console.error('lesson_media read failed:', mediaErr.message);
    return json({ error: 'server_error' }, 500);
  }

  let video: ReturnType<typeof signVideo> | { kind: 'youtube'; id: string } | null = null;
  const yt = parseYouTubeId(m?.video_id);
  if (yt) {
    // YouTube has no signed links: anyone with the id can watch. Only ever serve it for free previews.
    if (!lesson.is_free_preview) return json({ error: 'youtube_paid_blocked' }, 403);
    video = { kind: 'youtube', id: yt };
  } else if (m?.video_id) {
    try {
      video = signVideo(m.video_id);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : 'video_error' }, 503);
    }
  }
  let pdfUrl: string | null = null;
  if (m?.pdf_path) {
    const { data } = await admin.storage.from('lecture-pdfs').createSignedUrl(m.pdf_path, 300);
    pdfUrl = data?.signedUrl ?? null;
  }
  return json({ video, pdfUrl });
}
