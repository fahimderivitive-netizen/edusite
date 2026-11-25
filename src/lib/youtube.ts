export const YOUTUBE_URL = 'https://www.youtube.com/@quarkofeducation';
export const YOUTUBE_CHANNEL_ID = 'UCi0x9DOPGzUDzDaFAeqke-Q';

const ID = /^[\w-]{11}$/;

// Accepts "yt:ID", youtu.be/ID, youtube.com/watch?v=ID, /embed/ID, /shorts/ID and /live/ID. Returns the 11-char id or null.
export function parseYouTubeId(input: string | null | undefined): string | null {
  const s = (input ?? '').trim();
  if (!s) return null;
  const tagged = s.match(/^yt:([\w-]{11})$/);
  if (tagged) return tagged[1];
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^(www|m)\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return ID.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v');
      if (v && ID.test(v)) return v;
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch {
    // not a URL
  }
  return null;
}

export type YtVideo = { id: string; title: string; published: string };

const decode = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// Latest uploads from the channel's public RSS feed (no API key). Cached for an hour; returns [] if YouTube is unreachable.
export async function latestVideos(limit = 3): Promise<YtVideo[]> {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/<entry>[\s\S]*?<\/entry>/g)].slice(0, limit).flatMap((m) => {
      const id = m[0].match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
      const title = m[0].match(/<title>([^<]*)<\/title>/)?.[1];
      const published = m[0].match(/<published>([^<]+)<\/published>/)?.[1] ?? '';
      return id && title && ID.test(id) ? [{ id, title: decode(title), published }] : [];
    });
  } catch {
    return [];
  }
}
