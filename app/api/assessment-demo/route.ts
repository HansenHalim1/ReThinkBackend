import { ApiError, jsonBody } from '../../../lib/auth.ts';
import { cors, preflight } from '../../../lib/cors.ts';
import { assessmentCommand, assessmentView, freshAssessment, readAssessment } from '../../../lib/assessment.ts';
export const dynamic = 'force-dynamic';
// Anonymous practice only: no database, provider calls or account unlocks.
export function GET(request: Request) { return cors(request, () => Response.json({ ...assessmentView(freshAssessment(), 0), demoSession: freshAssessment() }, { headers: { 'Cache-Control': 'no-store' } })); }
export function POST(request: Request) {
  return cors(request, async () => {
    try {
      const body = await jsonBody(request, 8192);
      const next = assessmentCommand(readAssessment(body.demoSession), body);
      return Response.json({ ...assessmentView(next, 0), demoSession: next }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (e) { return Response.json({ error: e instanceof ApiError ? e.message : 'Permintaan tidak valid.' }, { status: e instanceof ApiError ? e.status : 400 }); }
  });
}
export function OPTIONS(request: Request) { return preflight(request, ['GET', 'POST']); }
