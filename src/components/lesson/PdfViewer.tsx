'use client';
import Watermark from './Watermark';

export default function PdfViewer({ url, mark, title }: { url: string; mark: string; title: string }) {
  return (
    <div className="relative h-[75vh] overflow-hidden rounded-xl border border-white/10 bg-zinc-900" onContextMenu={(e) => e.preventDefault()}>
      <iframe src={`${url}#toolbar=0&navpanes=0`} title={title} className="h-full w-full" />
      <Watermark text={mark} />
    </div>
  );
}
