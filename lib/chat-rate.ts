import { ApiError } from './auth.ts';
const windows=new Map<string,{start:number;count:number}>();
// Per-instance burst guard. Use an external rate limiter for a shared production quota.
export function chatRate(userId:string,kind:'chat'|'transcript') {
  const now=Date.now();const key=`${kind}:${userId}`;
  for(const [k,v] of windows) if(now-v.start>=60000) windows.delete(k);
  if(windows.size>=5000 && !windows.has(key)) throw new ApiError(429,'Layanan sedang sibuk. Coba lagi sebentar.');
  const current=windows.get(key) || {start:now,count:0};
  if(current.count >= (kind==='chat'?20:6)) throw new ApiError(429,'Terlalu banyak permintaan. Tunggu satu menit sebelum mencoba lagi.');
  current.count++;windows.set(key,current);
}
