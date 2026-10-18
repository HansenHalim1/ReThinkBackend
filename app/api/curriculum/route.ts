import { adminDatabase, authenticated, ApiError, jsonBody } from '../../../lib/auth.ts';
import { cors, preflight } from '../../../lib/cors.ts';
import { getMaterial, materials, pretestsComplete, publicMaterial } from '../../../lib/curriculum.ts';
export const dynamic = 'force-dynamic';

async function pretests(userId: string) {
  const { data, error } = await adminDatabase().from('learning_progress').select('concept,session').eq('user_id', userId);
  if (error) throw new ApiError(503, 'Kemajuan pretest belum dapat dimuat.');
  const sessions = Object.fromEntries((data || []).map(row => [row.concept, row.session]));
  return pretestsComplete(sessions);
}
function visibleProgress(row: { module_id: string; completed: boolean; attempts: number; revision: number }) {
  return { moduleId: row.module_id, completed: row.completed, attempts: row.attempts, revision: row.revision };
}
export function GET(request: Request) {
  return cors(request, () => authenticated(request, async ({ user }) => {
    const unlocked = await pretests(user.id);
    if (!unlocked) return Response.json({ unlocked: false, modules: materials.map(publicMaterial), progress: [] });
    const { data, error } = await adminDatabase().from('curriculum_progress').select('module_id,completed,attempts,revision').eq('user_id', user.id);
    if (error) throw new ApiError(503, 'Kemajuan materi belum dapat dimuat. Pastikan migrasi materi SMA sudah diterapkan.');
    return Response.json({ unlocked: true, modules: materials.map(publicMaterial), progress: (data || []).map(visibleProgress) });
  }));
}
export function POST(request: Request) {
  return cors(request, () => authenticated(request, async ({ user }) => {
    const body = await jsonBody(request);
    const material = typeof body.moduleId === 'string' ? getMaterial(body.moduleId) : undefined;
    if (!material || typeof body.answerId !== 'string' || !material.quiz.options.some(option => option.id === body.answerId) || !Number.isSafeInteger(body.expectedRevision) || Number(body.expectedRevision) < 0 || Number(body.expectedRevision) >= 2147483647) throw new ApiError(400, 'Jawaban materi tidak valid.');
    if (!await pretests(user.id)) throw new ApiError(403, 'Selesaikan kedua pretest sebelum membuka materi SMA.');
    const correct = body.answerId === material.quiz.correctOption;
    const { data, error } = await adminDatabase().rpc('save_curriculum_progress', {
      p_user_id: user.id, p_module_id: material.id, p_expected_revision: Number(body.expectedRevision), p_correct: correct,
    }).single<Parameters<typeof visibleProgress>[0]>();
    if (error?.message.includes('pretests_required')) throw new ApiError(403, 'Selesaikan kedua pretest sebelum membuka materi SMA.');
    if (error?.message.includes('revision_conflict')) return Response.json({ error: 'Kemajuan berubah di perangkat lain. Muat ulang sebelum melanjutkan.', code: 'revision_conflict' }, { status: 409 });
    if (error || !data) throw new ApiError(503, 'Kemajuan materi gagal disimpan. Pastikan migrasi materi SMA sudah diterapkan.');
    return Response.json({ correct, explanation: material.quiz.explanation, progress: visibleProgress(data) });
  }));
}
export function OPTIONS(request: Request) { return preflight(request, ['GET', 'POST']); }
