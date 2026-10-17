export function GET() {
  const endpoints = ['/api/health', '/api/me', '/api/progress', '/api/feedback'];
  if (process.env.NODE_ENV === 'development') endpoints.push('/api/diagnostic');
  return Response.json({ service: 'ReThink Backend', endpoints });
}
