export const userA = '00000000-0000-0000-0000-000000000001';
export const userB = '00000000-0000-0000-0000-000000000002';
export function mockSupabase() {
  const originalFetch = globalThis.fetch;
  const keys = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'ALLOWED_ORIGINS', 'GEMINI_API_KEY'];
  const env = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.SUPABASE_URL = 'https://supabase.test';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';
  process.env.ALLOWED_ORIGINS = 'https://learn.example.com,http://localhost:3000';
  delete process.env.GEMINI_API_KEY;
  type Row = { user_id: string; concept: string; session: unknown; revision: number };
  const rows = new Map<string, Row>();
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const token = request.headers.get('authorization');
    const uid = token === 'Bearer user-a' ? userA : token === 'Bearer user-b' ? userB : null;
    if (url.pathname === '/auth/v1/user') return uid ? reply({ id: uid, aud: 'authenticated', email: `${uid}@example.test`, user_metadata: {}, created_at: '2026-10-17T00:00:00Z' }) : reply({ message: 'invalid token', code: 'bad_jwt' }, 401);
    if (url.pathname === '/rest/v1/rpc/save_learning_progress') {
      if (request.headers.get('apikey') !== 'sb_secret_test') return reply({}, 403);
      const body = await request.json();
      const key = `${body.p_user_id}:${body.p_concept}`;
      if ((rows.get(key)?.revision || 0) !== body.p_expected_revision) return reply({ code: 'P0001', message: 'revision_conflict' }, 400);
      const row = { user_id: body.p_user_id, concept: body.p_concept, session: body.p_session, revision: body.p_expected_revision + 1 };
      rows.set(key, structuredClone(row));
      return reply(row);
    }
    if (url.pathname === '/rest/v1/learning_progress') {
      const owner = url.searchParams.get('user_id')?.slice(3);
      const serviceRole = request.headers.get('apikey') === 'sb_secret_test';
      if (!owner || (!serviceRole && (!uid || owner !== uid))) return reply([], 200);
      const concept = url.searchParams.get('concept')?.slice(3);
      return reply([...rows.values()].filter(row => row.user_id === owner && (!concept || row.concept === concept)));
    }
    if (url.pathname === '/rest/v1/profiles') return reply(uid ? [{ display_name: uid === userA ? 'Siswa A' : 'Siswa B', created_at: '2026-10-17T00:00:00Z' }] : []);
    throw Error(`Unexpected network request: ${url.origin}${url.pathname}`);
  };
  return { rows, restore() { globalThis.fetch = originalFetch; for (const key of keys) { if (env[key] === undefined) delete process.env[key]; else process.env[key] = env[key]; } } };
}
