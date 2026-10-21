import catalog from './data/video-catalog.v1.json' with { type: 'json' };
import { concepts } from './content.ts';
import { materials } from './curriculum.ts';
import { ApiError } from './auth.ts';

const knownTopics = new Set<string>([...concepts.map(c => c.id), ...materials.map(m => m.id), 'advanced-derivatives']);
export function videoTopicExists(id: string) { return knownTopics.has(id); }

export function mediaBase(requestUrl: string) {
  const configured = process.env.VIDEO_ASSET_BASE_URL?.trim();
  let base: URL;
  try {
    base = configured ? new URL(configured.endsWith('/') ? configured : `${configured}/`) : new URL('/videos/', requestUrl);
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw Error();
    if (configured && base.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) throw Error();
  } catch { throw new ApiError(503, 'Penyimpanan video belum tersedia.'); }
  return base;
}

export function videoCatalog(requestUrl: string, topicId?: string) {
  const base = mediaBase(requestUrl);
  return {
    schemaVersion: 1 as const, catalogVersion: catalog.catalogVersion,
    videos: catalog.videos.filter(v => !topicId || v.topicId === topicId).map(({ videoFile, posterFile, captionsFile, ...v }) => ({
      ...v, videoUrl: new URL(videoFile, base).href, posterUrl: new URL(posterFile, base).href,
      captionsUrl: new URL(captionsFile, base).href,
    })),
  };
}
