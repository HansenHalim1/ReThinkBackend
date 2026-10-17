import { authenticated, ApiError } from '../../../lib/auth.ts';
import { cors, preflight } from '../../../lib/cors.ts';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  return cors(request, () => authenticated(request, async ({ user, db }) => {
    const { data, error } = await db.from('profiles').select('display_name,created_at').eq('id', user.id).maybeSingle();
    if (error) throw new ApiError(503, 'Profil belum dapat dimuat.');
    return Response.json({ id: user.id, email: user.email, displayName: data?.display_name || 'Siswa ReThink', createdAt: data?.created_at });
  }));
}
export function OPTIONS(request: Request) { return preflight(request, 'GET'); }
