import { adminDatabase, authenticated, ApiError, jsonBody } from '../../../lib/auth.ts';
import { cors, preflight } from '../../../lib/cors.ts';
import { applyCommand, parseCommand } from '../../../lib/progress.ts';
import { readSaved } from '../../../lib/storage.ts';
import { newSession, type Session } from '../../../lib/engine.ts';
import { selectAdaptiveProbe } from '../../../lib/diagnostic.ts';
export const dynamic = 'force-dynamic';
function learnerSession(session: Session) {
  const { diagnosis: _diagnosis, mastery: _mastery, hypothesis: _hypothesis, attempts, ...visible } = session;
  return { ...visible, attempts: attempts.map(({ knownError: _knownError, errorType: _errorType, ...attempt }) => attempt) };
}
export function GET(request: Request) {
  return cors(request, () => authenticated(request, async ({ user }) => {
    const { data, error } = await adminDatabase().from('learning_progress').select('concept,session,revision').eq('user_id', user.id);
    if (error) throw new ApiError(503, 'Kemajuan belum dapat dimuat.');
    const sessions = Object.fromEntries((data || []).map(row => [row.concept, row.session]));
    const saved = readSaved(JSON.stringify({ version: 1, sessions }));
    if (!saved) throw new ApiError(503, 'Data kemajuan tidak valid.');
    const learnerSessions: Record<string, ReturnType<typeof learnerSession>> = {};
    for (const [concept, session] of Object.entries(saved.sessions)) if (session) learnerSessions[concept] = learnerSession(session);
    return Response.json({ version: saved.version, sessions: learnerSessions, revisions: Object.fromEntries((data || []).map(row => [row.concept, row.revision])) });
  }));
}
export function POST(request: Request) {
  return cors(request, () => authenticated(request, async ({ user }) => {
    const command = parseCommand(await jsonBody(request));
    if (!command) throw new ApiError(400, 'Tindakan belajar tidak valid.');
    const { data: row, error } = await adminDatabase().from('learning_progress').select('session,revision').eq('user_id', user.id).eq('concept', command.concept).maybeSingle();
    if (error) throw new ApiError(503, 'Kemajuan belum dapat dimuat.');
    if ((row?.revision || 0) !== command.expectedRevision) return Response.json({ error: 'Kemajuan berubah di perangkat lain. Muat ulang sebelum melanjutkan.', code: 'revision_conflict' }, { status: 409 });
    const existing = row ? readSaved(JSON.stringify({ version: 1, sessions: { [command.concept]: row.session } })) : null;
    if (row && !existing) throw new ApiError(503, 'Data kemajuan tidak valid.');
    const current = existing?.sessions[command.concept] || newSession(command.concept);
    const adaptive = command.action === 'submit' ? await selectAdaptiveProbe(current, command.answer!, command.reasoning!) : undefined;
    const session = applyCommand(current, command, adaptive?.selection);
    if (!session) throw new ApiError(400, 'Jawaban atau tahap belajar tidak valid.');
    const { data, error: writeError } = await adminDatabase().rpc('save_learning_progress', { p_user_id: user.id, p_concept: command.concept, p_expected_revision: command.expectedRevision, p_session: session }).single();
    if (writeError?.message.includes('revision_conflict')) return Response.json({ error: 'Kemajuan berubah di perangkat lain. Muat ulang sebelum melanjutkan.', code: 'revision_conflict' }, { status: 409 });
    if (writeError) throw new ApiError(503, 'Kemajuan gagal disimpan. Coba lagi.');
    const responseData = data && typeof data === 'object' && !Array.isArray(data)
      ? { ...data, session: learnerSession(session), ...(adaptive ? { ai: adaptive.ai } : {}) }
      : data;
    return Response.json(responseData);
  }));
}
export function OPTIONS(request: Request) { return preflight(request, ['GET', 'POST']); }
