import { ApiError, jsonBody } from './auth.ts';
import { validCues, youtubeId } from './transcripts.ts';
export function parseYouTube(body:Record<string,unknown>) {
  if(Object.keys(body).some(k=>!['url','language'].includes(k)) || (body.language!==undefined && body.language!=='en' && body.language!=='id') || typeof body.url!=='string' || body.url.length>2048) throw new ApiError(400,'Tautan YouTube tidak valid.');
  const id=youtubeId(body.url);if(!id) throw new ApiError(400,'Gunakan tautan HTTPS YouTube yang valid.');return {id,language:(body.language || 'en') as 'en'|'id'};
}
export function normalizeTranscript(value:unknown) {
  if(!value || typeof value!=='object') throw new ApiError(502,'Format transkrip tidak valid.');
  const v=value as {content?:unknown;lang?:unknown};
  if(!Array.isArray(v.content) || v.content.length>3000) throw new ApiError(422,'Transkrip berwaktu tidak tersedia. Impor subtitle SRT / VTT.');
  const cues=v.content.map(c=>{if(!c || typeof c!=='object' || typeof c.offset!=='number' || typeof c.duration!=='number') throw new ApiError(502,'Format transkrip tidak valid.');return {startSeconds:c.offset/1000,endSeconds:(c.offset+c.duration)/1000,text:typeof c.text==='string'?c.text.trim():''};});
  if(!validCues(cues)) throw new ApiError(422,'Transkrip berwaktu tidak tersedia atau terlalu panjang. Impor subtitle SRT / VTT.');
  return {transcript:cues,language:typeof v.lang==='string'?v.lang:'und'};
}
export async function youtubeTranscript(id:string,signal?:AbortSignal,language:'en'|'id'='en') {
  const key=process.env.SUPADATA_API_KEY?.trim();
  if(!key) throw new ApiError(503,'Transkrip YouTube otomatis belum dikonfigurasi. Video tetap dapat diputar; impor subtitle SRT / VTT di bawah.');
  const url=new URL('https://api.supadata.ai/v1/transcript');
  url.searchParams.set('url',`https://www.youtube.com/watch?v=${id}`);url.searchParams.set('text','false');url.searchParams.set('mode','native');url.searchParams.set('lang',language);
  let response:Response;
  try {response=await fetch(url,{headers:{'x-api-key':key},cache:'no-store',redirect:'error',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(18000)]):AbortSignal.timeout(18000)});}
  catch {throw new ApiError(503,'Layanan transkrip tidak merespons. Coba lagi atau impor subtitle.');}
  if(response.status===202) throw new ApiError(422,'Transkrip belum siap. Coba lagi nanti atau impor subtitle SRT / VTT.');
  if(!response.ok) throw new ApiError(response.status===404 || response.status===422?422:503,'Transkrip tidak tersedia dari layanan subtitle. Coba lagi atau impor subtitle SRT / VTT.');
  let data:Record<string,unknown>;
  try {data=await jsonBody(new Request('https://transcript.internal',{method:'POST',body:response.body,duplex:'half'} as RequestInit),750000);}
  catch {throw new ApiError(502,'Transkrip terlalu besar atau tidak valid.');}
  const normalized=normalizeTranscript(data);
  const actual=normalized.language.toLowerCase().split('-')[0];
  if(actual!==language || (Array.isArray(data.content) && data.content.some(c=>c?.lang && (typeof c.lang!=='string' || c.lang.toLowerCase().split('-')[0]!==language)))) throw new ApiError(422,`Transkrip ${language==='en'?'English':'Bahasa Indonesia'} tidak tersedia untuk video ini. Pilih bahasa lain atau impor subtitle SRT / VTT; transkrip bahasa lain tidak digunakan otomatis.`);
  return {id,title:`YouTube · ${id}`,transcriptOrigin:'provider',...normalized,language};
}
