import { concepts } from '../../../lib/content.ts';
import { cors, preflight } from '../../../lib/cors.ts';
import { selectAdaptiveProbe } from '../../../lib/diagnostic.ts';
import { readSaved } from '../../../lib/storage.ts';

export const runtime = 'nodejs';
async function handlePost(request: Request) {
  if (process.env.NODE_ENV !== 'development') return Response.json({ error: 'Endpoint demo hanya tersedia saat development.' }, { status: 404 });
  const origin = request.headers.get('origin');
  if (!origin || !['http://localhost:3000', 'http://127.0.0.1:3000'].includes(origin)) return Response.json({ error: 'Origin tidak diizinkan.' }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 12000) return Response.json({ error: 'Permintaan terlalu panjang.' }, { status: 413 });
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error();
    body = parsed as Record<string, unknown>;
  } catch { return Response.json({ error: 'Permintaan tidak valid.' }, { status: 400 }); }
  if (typeof body.concept !== 'string' || !concepts.some(c => c.id === body.concept) || typeof body.answer !== 'string' || body.answer.length > 160 || typeof body.reasoning !== 'string' || body.reasoning.length > 1200 || !body.session || typeof body.session !== 'object' || Array.isArray(body.session)) {
    return Response.json({ error: 'Jawaban atau sesi demo tidak valid.' }, { status: 400 });
  }
  const saved = readSaved(JSON.stringify({ version: 1, sessions: { [body.concept]: body.session } }));
  const session = saved?.sessions[body.concept as keyof typeof saved.sessions];
  if (!session) return Response.json({ error: 'Sesi demo tidak valid.' }, { status: 400 });
  const selection = await selectAdaptiveProbe(session, body.answer, body.reasoning);
  if (!selection) return Response.json({ error: 'Probe adaptif tidak tersedia.' }, { status: 400 });
  return Response.json(selection, { headers: { 'Cache-Control': 'no-store' } });
}
export function POST(request: Request) { return cors(request, () => handlePost(request)); }
export function OPTIONS(request: Request) {
  return process.env.NODE_ENV === 'development' ? preflight(request, 'POST') : Promise.resolve(Response.json({ error: 'Endpoint demo hanya tersedia saat development.' }, { status: 404 }));
}
