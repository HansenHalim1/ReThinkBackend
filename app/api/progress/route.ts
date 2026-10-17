import { adminDatabase, authenticated, ApiError, jsonBody } from '../../../lib/auth.ts';
import { cors, preflight } from '../../../lib/cors.ts';
import { applyCommand, parseCommand } from '../../../lib/progress.ts';
import { readSaved } from '../../../lib/storage.ts';
import { newSession } from '../../../lib/engine.ts';
import { selectAdaptiveProbe } from '../../../lib/diagnostic.ts';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  return cors(request, () => authenticated(request, async ({ user, db }) => {
    const { data, error } = await db.from('learning_progress').select('concept,session,revision').eq('user_id', user.id);
    if (error) throw new ApiError(503, 'Kemajuan belum dapat dimuat.');
    const sessions = Object.fromEntries((data || []).map(row => [row.concept, row.session]));
    const saved = readSaved(JSON.stringify({ version: 1, sessions }));
    if (!saved) throw new ApiError(503, 'Data kemajuan tidak valid.');
    return Response.json({ ...saved, revisions: Object.fromEntries((data || []).map(row => [row.concept, row.revision])) });
  }));
}
export function POST(request: Request) {
  return cors(request, () => authenticated(request, async ({ user, db }) => {
    const command = parseCommand(await jsonBody(request));
    if (!command) throw new ApiError(400, 'Tindakan belajar tidak valid.');
    const { data: row, error } = await db.from('learning_progress').select('session,revision').eq('user_id', user.id).eq('concept', command.concept).maybeSingle();
    if (error) throw new ApiError(503, 'Kemajuan belum dapat dimuat.');
    if ((row?.revision || 0) !== command.expectedRevision) return Response.json({ error: 'Kemajuan berubah di perangkat lain. Muat ulang sebelum melanjutkan.', code: 'revision_conflict' }, { status: 409 });
    const existing = row ? readSaved(JSON.stringify({ version: 1, sessions: { [command.concept]: row.session } })) : null;
    if (row && !existing) throw new ApiError(503, 'Data kemajuan tidak valid.');
    const current = existing?.sessions[command.concept] || newSession(command.concept);
    const selection = command.action === 'submit' ? await selectAdaptiveProbe(current, command.answer!, command.reasoning!) : undefined;
    const session = applyCommand(current, command, selection);
    if (!session) throw new ApiError(400, 'Jawaban atau tahap belajar tidak valid.');
    const { data, error: writeError } = await adminDatabase().rpc('save_learning_progress', { p_user_id: user.id, p_concept: command.concept, p_expected_revision: command.expectedRevision, p_session: session }).single();
    if (writeError?.message.includes('revision_conflict')) return Response.json({ error: 'Kemajuan berubah di perangkat lain. Muat ulang sebelum melanjutkan.', code: 'revision_conflict' }, { status: 409 });
    if (writeError) throw new ApiError(503, 'Kemajuan gagal disimpan. Coba lagi.');
    return Response.json(data);
  }));
}
export function OPTIONS(request: Request) { return preflight(request, ['GET', 'POST']); }
