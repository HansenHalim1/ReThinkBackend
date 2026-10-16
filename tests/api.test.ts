import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST, OPTIONS } from '../app/api/feedback/route.ts';
import { GET } from '../app/api/health/route.ts';
import { getConcept } from '../lib/content.ts';

test('API supports browser preflight, Swift, validation, and curated fallback', async () => {
  const previous = { origins: process.env.ALLOWED_ORIGINS, key: process.env.GEMINI_API_KEY };
  process.env.ALLOWED_ORIGINS = 'https://learn.example.com,http://localhost:3000';
  delete process.env.GEMINI_API_KEY;
  const url = 'http://localhost:3001/api/feedback';
  const origin = 'https://learn.example.com';
  const questionId = getConcept('distribution').questions.diagnosis.id;
  const body = JSON.stringify({ questionId, answer: '3x+2', reasoning: '' });
  const request = (payload: string, site?: string) => new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(site ? { Origin: site } : {}) }, body: payload });
  try {
    const preflight = await OPTIONS(new Request(url, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } }));
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
    assert.match(preflight.headers.get('Vary')!, /Origin/);
    const rejectedPreflight = await OPTIONS(new Request(url, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'DELETE' } }));
    assert.equal(rejectedPreflight.status, 403);
    const denied = await POST(request(body, 'https://learn.example.com.evil.test'));
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get('Access-Control-Allow-Origin'), null);
    for (const site of [origin, undefined, 'http://localhost:3001']) {
      const result = await POST(request(body, site));
      assert.equal(result.status, 200);
      assert.equal(result.headers.get('Cache-Control'), 'no-store');
      const data = await result.json();
      assert.equal(data.source, 'curated');
      assert.equal(data.reason, 'not-configured');
      assert.equal(typeof data.feedback, 'string');
    }
    for (const payload of ['{', 'null', JSON.stringify({ questionId }), JSON.stringify({ questionId: 'unknown', answer: '3', reasoning: '' }), JSON.stringify({ questionId: getConcept('distribution').questions.retry.id, answer: '3', reasoning: '' })]) {
      const result = await POST(request(payload, origin));
      assert.equal(result.status, 400);
      assert.equal(result.headers.get('Access-Control-Allow-Origin'), origin);
    }
    assert.equal((await POST(request('x'.repeat(4001), origin))).status, 413);
    const health = await GET(new Request('http://localhost:3001/api/health', { headers: { Origin: origin } }));
    assert.equal(health.headers.get('Access-Control-Allow-Origin'), origin);
    assert.equal((await health.json()).aiConfigured, false);
  } finally {
    if (previous.origins === undefined) delete process.env.ALLOWED_ORIGINS; else process.env.ALLOWED_ORIGINS = previous.origins;
    if (previous.key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previous.key;
  }
});
