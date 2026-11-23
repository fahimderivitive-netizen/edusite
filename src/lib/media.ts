import { createHash } from 'node:crypto';

export type SignedVideo = { src: string; kind: 'hls' | 'file'; qs?: string };

// Bunny Stream (pull zone) token authentication with a directory-scoped token_path, valid for a few hours.
// Needs BUNNY_CDN_HOST (e.g. vz-xxxx.b-cdn.net) and BUNNY_TOKEN_KEY (pull zone security key).
export function signVideo(videoId: string): SignedVideo {
  if (/^https?:\/\//.test(videoId)) {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DIRECT_VIDEO_URLS !== '1') throw new Error('direct_url_blocked');
    return { src: videoId, kind: videoId.includes('.m3u8') ? 'hls' : 'file' };
  }
  const host = process.env.BUNNY_CDN_HOST;
  const key = process.env.BUNNY_TOKEN_KEY;
  if (!host || !key) throw new Error('not_configured');
  const expires = Math.floor(Date.now() / 1000) + 3 * 3600;
  const tokenPath = `/${videoId}/`;
  const token = createHash('sha256')
    .update(`${key}${tokenPath}${expires}token_path=${tokenPath}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return {
    src: `https://${host}/${videoId}/playlist.m3u8`,
    kind: 'hls',
    qs: `token=${token}&token_path=${encodeURIComponent(tokenPath)}&expires=${expires}`,
  };
}
