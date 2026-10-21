export function GET() {
  const endpoints = ['/api/health', '/api/assessment', '/api/assessment-demo', '/api/me', '/api/progress', '/api/feedback', '/api/curriculum', '/api/videos', '/api/visualizations', '/api/video-help', '/api/chat', '/api/youtube-transcript'];
  if (process.env.NODE_ENV === 'development') endpoints.push('/api/diagnostic');
  return Response.json({ service: 'ReThink Backend', endpoints });
}
