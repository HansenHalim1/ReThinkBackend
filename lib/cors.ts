function allowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Native Swift and server clients do not need CORS.
  if (origin === new URL(request.url).origin) return true;
  const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
  return origins.includes(origin);
}
function decorate(request: Request, response: Response): Response {
  response.headers.append('Vary', 'Origin');
  response.headers.set('Cache-Control', 'no-store');
  const origin = request.headers.get('origin');
  if (origin && allowed(request)) response.headers.set('Access-Control-Allow-Origin', origin);
  return response;
}
export async function cors(request: Request, handler: () => Response | Promise<Response>): Promise<Response> {
  if (!allowed(request)) return decorate(request, Response.json({ error: 'Origin tidak diizinkan.' }, { status: 403 }));
  return decorate(request, await handler());
}
export function preflight(request: Request, methods: 'GET' | 'POST' | ('GET' | 'POST')[]): Promise<Response> {
  const allowedMethods = Array.isArray(methods) ? methods : [methods];
  return cors(request, () => {
    const requestedMethod = request.headers.get('access-control-request-method');
    const requestedHeaders = (request.headers.get('access-control-request-headers') || '').toLowerCase().split(',').map(v => v.trim()).filter(Boolean);
    if ((requestedMethod && !allowedMethods.includes(requestedMethod as 'GET' | 'POST')) || requestedHeaders.some(v => !['content-type', 'authorization'].includes(v))) {
      return Response.json({ error: 'Preflight tidak diizinkan.' }, { status: 403 });
    }
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Methods': `${allowedMethods.join(', ')}, OPTIONS`,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Access-Control-Request-Method, Access-Control-Request-Headers',
    } });
  });
}
