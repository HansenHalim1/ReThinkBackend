import { cors, preflight } from '../../../lib/cors.ts';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  return cors(request, () => Response.json({ aiConfigured: Boolean(process.env.GEMINI_API_KEY), model: process.env.GEMINI_MODEL || 'gemini-3.8-flash' }, { headers: { 'Cache-Control': 'no-store' } }));
}
export function OPTIONS(request: Request) { return preflight(request, 'GET'); }
