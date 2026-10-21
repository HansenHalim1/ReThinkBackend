type TranscriptCue = {startSeconds:number;endSeconds:number;text:string};
export function youtubeId(input: string): string | null {
  try {
    const u = new URL(input.trim());
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    const host = u.hostname.toLowerCase();
    const id = host === 'youtu.be' ? u.pathname.slice(1) : ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host) ? (u.pathname === '/watch' ? u.searchParams.get('v') : /^\/(?:embed|shorts|live)\/([^/]+)\/?$/.exec(u.pathname)?.[1]) : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}
export function activeCue(cues: TranscriptCue[], time: number): number { return cues.findIndex(c => time >= c.startSeconds && time < c.endSeconds); }
export function timestamp(time: number): string { return `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`; }
export function validCues(value: unknown): value is TranscriptCue[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 3000 && value.every((c, i) => c && typeof c.text === 'string' && c.text.trim().length > 0 && c.text.length <= 2000 && Number.isFinite(c.startSeconds) && Number.isFinite(c.endSeconds) && c.startSeconds >= 0 && c.endSeconds > c.startSeconds && c.endSeconds <= 86400 && (i === 0 || c.startSeconds >= value[i-1].startSeconds)) && value.reduce((n,c) => n+c.text.length, 0) <= 200000;
}
function seconds(text: string) { return text.replace(',', '.').split(':').reduce((n,s) => n*60+Number(s), 0); }
export function parseCaptions(text: string): TranscriptCue[] {
  if (text.length > 250000) throw Error('Transkrip terlalu panjang.');
  const cues: TranscriptCue[] = [];
  const lines = text.replace(/\r/g,'').split('\n');
  for (let i=0;i<lines.length;i++) {
    const match = /^(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3})\s+-->\s+(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3})(?:\s.*)?$/.exec(lines[i].trim());
    if (!match) continue;
    const content: string[] = [];
    while (++i<lines.length && lines[i].trim()) content.push(lines[i].trim());
    cues.push({ startSeconds: seconds(match[1]), endSeconds: seconds(match[2]), text: content.join(' ').replace(/<[^>]*>/g,'').trim() });
  }
  if (!validCues(cues)) throw Error('Gunakan subtitle berwaktu berformat SRT atau WebVTT yang valid.');
  return cues;
}
