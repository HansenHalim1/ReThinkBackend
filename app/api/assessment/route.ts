import { adminDatabase, authenticated, ApiError, jsonBody } from '../../../lib/auth.ts';
import { cors, preflight } from '../../../lib/cors.ts';
import { assessmentCommand, assessmentView, freshAssessment, readAssessment, type AssessmentSession } from '../../../lib/assessment.ts';
export const dynamic = 'force-dynamic';
type Row = { session: AssessmentSession; revision: number };
async function load(userId: string): Promise<Row> {
  const { data, error } = await adminDatabase().from('foundation_assessments').select('session,revision').eq('user_id', userId).maybeSingle<Row>();
  if (error) throw new ApiError(503, 'Pretest belum dapat dimuat. Pastikan migrasi pretest sudah diterapkan.');
  return data ? { session: readAssessment(data.session), revision: data.revision } : { session: freshAssessment(), revision: 0 };
}
const respond = (row: Row) => Response.json(assessmentView(row.session, row.revision), { headers: { 'Cache-Control': 'no-store' } });
export function GET(request: Request) {
  return cors(request, () => authenticated(request, async ({ user }) => respond(await load(user.id))));
}
export function POST(request: Request) {
  return cors(request, () => authenticated(request, async ({ user }) => {
    const body = await jsonBody(request);
    if (!Number.isSafeInteger(body.expectedRevision) || Number(body.expectedRevision) < 0 || Number(body.expectedRevision) >= 2147483647) throw new ApiError(400, 'Revisi pretest tidak valid.');
    const current = await load(user.id);
    if (body.expectedRevision !== current.revision) throw new ApiError(409, 'Pretest berubah di perangkat lain. Muat ulang sebelum melanjutkan.');
    const next = assessmentCommand(current.session, body);
    const { data, error } = await adminDatabase().rpc('save_foundation_assessment', { p_user_id: user.id, p_expected_revision: current.revision, p_session: next }).single<Row>();
    if (error?.message.includes('revision_conflict')) throw new ApiError(409, 'Pretest berubah di perangkat lain. Muat ulang sebelum melanjutkan.');
    if (error || !data) throw new ApiError(503, 'Jawaban belum tersimpan. Coba lagi.');
    return respond({ session: readAssessment(data.session), revision: data.revision });
  }));
}
export function OPTIONS(request: Request) { return preflight(request, ['GET', 'POST']); }
