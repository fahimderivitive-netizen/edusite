'use client';
import { useRef, useState, useTransition } from 'react';
import { Camera, Mic, Square, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { dict, type Lang } from '@/lib/i18n/dict';

const MAX = 5 * 1024 * 1024;

// Text + optional photo + optional voice note. Files go straight to the private doubt-media bucket under the
// user's own folder; the server action then validates the paths before saving them.
export default function DoubtComposer({ action, userId, hidden = {}, placeholder, lang }: {
  action: (fd: FormData) => Promise<void>; userId: string; hidden?: Record<string, string>; placeholder?: string; lang: Lang;
}) {
  const t = dict[lang].engage;
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  async function startRec() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => chunks.current.push(e.data);
      r.onstop = () => {
        const blob = new Blob(chunks.current, { type: r.mimeType || 'audio/webm' });
        stream.getTracks().forEach((tr) => tr.stop());
        setAudio(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      r.start();
      rec.current = r;
      setRecording(true);
    } catch {
      setError(t.micError);
    }
  }
  const stopRec = () => { rec.current?.stop(); setRecording(false); };
  const clearAudio = () => { setAudio(null); setAudioUrl(''); };

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if ((image && image.size > MAX) || (audio && audio.size > MAX)) return setError(t.fileError);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      try {
        const storage = createClient().storage.from('doubt-media');
        if (image) {
          const path = `${userId}/${crypto.randomUUID()}.${(image.type.split('/')[1] || 'png').replace('jpeg', 'jpg')}`;
          const { error: err } = await storage.upload(path, image, { contentType: image.type });
          if (err) throw new Error(err.message);
          fd.set('image_path', path);
        }
        if (audio) {
          const base = (audio.type.split(';')[0] || 'audio/webm');
          const path = `${userId}/${crypto.randomUUID()}.${base.split('/')[1] === 'mpeg' ? 'mp3' : base.split('/')[1]}`;
          const { error: err } = await storage.upload(path, audio, { contentType: base });
          if (err) throw new Error(err.message);
          fd.set('audio_path', path);
        }
        await action(fd);
        setText(''); setImage(null); clearAudio();
      } catch (err) {
        if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) throw err;
        setError(err instanceof Error ? err.message : 'Error');
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-white/10 bg-[#111113] p-4">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <textarea
        name="body" rows={3} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder ?? t.question}
        className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-400/50 focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-zinc-300 transition hover:border-white/20">
          <Camera size={16} /> {image ? image.name.slice(0, 18) : t.photo}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        </label>
        {image && <button type="button" onClick={() => setImage(null)} aria-label={t.remove} className="text-zinc-500 hover:text-red-300"><X size={16} /></button>}
        {recording ? (
          <button type="button" onClick={stopRec} className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-1.5 text-red-300">
            <Square size={14} /> {t.stop} · {t.recording}
          </button>
        ) : (
          <button type="button" onClick={startRec} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-zinc-300 transition hover:border-white/20">
            <Mic size={16} /> {t.record}
          </button>
        )}
        {audioUrl && (
          <>
            <audio controls src={audioUrl} className="h-8" />
            <button type="button" onClick={clearAudio} aria-label={t.remove} className="text-zinc-500 hover:text-red-300"><X size={16} /></button>
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button disabled={pending || recording} className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95 disabled:opacity-50">{t.send}</button>
    </form>
  );
}
