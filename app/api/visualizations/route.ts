import { ApiError } from '../../../lib/auth.ts';
import { cors, preflight } from '../../../lib/cors.ts';
import { visualizationCatalog, visualTopicExists } from '../../../lib/visualizations.ts';
export const dynamic = 'force-dynamic';

// Public reference media. No account, grading, AI, or progress writes.
export function GET(request: Request) {
  return cors(request, () => {
    const params = new URL(request.url).searchParams;
    const ids = params.getAll('topicId');
    if ([...params.keys()].some(key => key !== 'topicId') || ids.length > 1 || (ids.length === 1 && !/^[a-z][a-z0-9-]{0,79}$/.test(ids[0]))) {
      return Response.json({ error: 'Parameter topik tidak valid.' }, { status: 400 });
    }
    const topicId = ids[0];
    if (topicId && !visualTopicExists(topicId)) return Response.json({ error: 'Topik tidak ditemukan.' }, { status: 404 });
    try { return Response.json(visualizationCatalog(request.url, topicId)); }
    catch (error) {
      return Response.json({ error: error instanceof ApiError ? error.message : 'Visualisasi belum dapat dimuat.' }, { status: 503 });
    }
  });
}
export function OPTIONS(request: Request) { return preflight(request, 'GET'); }
