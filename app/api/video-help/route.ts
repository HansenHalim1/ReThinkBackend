import { authenticated, jsonBody } from '../../../lib/auth.ts';
import { cors, preflight } from '../../../lib/cors.ts';
import { parseVideoHelp, explainVideo } from '../../../lib/video-help.ts';
export const runtime = 'nodejs';
export const maxDuration = 30;
export function POST(request: Request) {
  return cors(request, () => authenticated(request, async () => {
    const command = parseVideoHelp(await jsonBody(request));
    return Response.json(await explainVideo(command, request.signal));
  }));
}
export function OPTIONS(request: Request) { return preflight(request, 'POST'); }
