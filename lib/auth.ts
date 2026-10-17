import { createClient } from '@supabase/supabase-js';
import type { User, SupabaseClient } from '@supabase/supabase-js';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
function settings() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new ApiError(503, 'Layanan akun belum tersedia.');
  return { url, key };
}
export async function authenticate(request: Request): Promise<{ user: User; db: SupabaseClient }> {
  const match = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') || '');
  if (!match) throw new ApiError(401, 'Silakan masuk untuk melanjutkan.');
  const { url, key } = settings();
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { headers: { Authorization: `Bearer ${match[1]}` } } });
  let result;
  try { result = await db.auth.getUser(match[1]); }
  catch { throw new ApiError(503, 'Layanan akun tidak dapat dihubungi.'); }
  if (result.error || !result.data.user) {
    if (result.error && (!result.error.status || result.error.status >= 500)) throw new ApiError(503, 'Layanan akun tidak dapat dihubungi.');
    throw new ApiError(401, 'Sesi tidak valid atau sudah berakhir. Silakan masuk kembali.');
  }
  return { user: result.data.user, db };
}
export function adminDatabase() {
  const { url } = settings();
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new ApiError(503, 'Penyimpanan akun belum tersedia.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
export async function authenticated(request: Request, handler: (context: Awaited<ReturnType<typeof authenticate>>) => Promise<Response>): Promise<Response> {
  try { return await handler(await authenticate(request)); }
  catch (error) {
    if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: 'Layanan tidak tersedia. Coba lagi nanti.' }, { status: 503 });
  }
}
export async function jsonBody(request: Request, limit = 4096): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'Permintaan tidak valid.');
  const decoder = new TextDecoder();
  let size = 0, text = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new ApiError(413, 'Permintaan terlalu panjang.'); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(400, 'Permintaan tidak valid.'); }
}
