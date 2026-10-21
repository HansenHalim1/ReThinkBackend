import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mockSupabase } from './helpers.ts';
import { POST, OPTIONS } from '../app/api/video-help/route.ts';
import { parseVideoHelp, validVideoExplanation } from '../lib/video-help.ts';
import catalog from '../lib/data/video-catalog.v1.json' with { type: 'json' };
import explanations from '../lib/data/video-explanations.v1.json' with { type: 'json' };

const command = { videoId: 'distribution-v1', videoVersion: 1, cueIndex: 1, question: 'Mengapa bagian dua juga dikalikan?' };
const request = (body: unknown, token: string | null = 'user-a', origin?: string) => new Request('https://api.example.com/api/video-help', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(origin ? { Origin: origin } : {}) }, body: typeof body === 'string' ? body : JSON.stringify(body),
});

test('video questions require authentication and server-owned, versioned transcript selection', async () => {
  const mock = mockSupabase();
  try {
    assert.equal((await POST(request(command, null))).status, 401);
    assert.equal((await POST(request(command, 'forged'))).status, 401);
    assert.equal((await POST(request(command, 'user-a', 'https://evil.example'))).status, 403);
    for (const body of ['{', 'null', {}, { ...command, cueIndex: -1 }, { ...command, cueIndex: 0.5 }, { ...command, cueIndex: 99 }, { ...command, question: ' ' }, { ...command, question: 'x'.repeat(801) }, { ...command, transcript: 'client-injected content' }]) {
      assert.equal((await POST(request(body))).status, 400);
    }
    assert.equal((await POST(request('x'.repeat(4097)))).status, 413);
    assert.equal((await POST(request({ ...command, videoId: 'unknown' }))).status, 404);
    assert.equal((await POST(request({ ...command, videoVersion: 2 }))).status, 409);
    const fallback = await POST(request(command, 'user-a', 'https://learn.example.com'));
    assert.equal(fallback.status, 200);
    assert.equal(fallback.headers.get('Cache-Control'), 'no-store');
    assert.equal(fallback.headers.get('Access-Control-Allow-Origin'), 'https://learn.example.com');
    const data = await fallback.json();
    assert.equal(data.source, 'curated');
    assert.equal(data.reason, 'not-configured');
    assert.equal(data.cueIndex, 1);
    assert.equal(data.explanation, explanations['distribution-v1'][1]);
    const options = await OPTIONS(new Request('https://api.example.com/api/video-help', { method: 'OPTIONS', headers: { Origin: 'https://learn.example.com', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } }));
    assert.equal(options.status, 204);
  } finally { mock.restore(); }
});

test('DeepSeek gets canonical passage context, excludes thoughts and falls back on provider/output failures', async () => {
  const mock = mockSupabase();
  const savedModel = process.env.AI_GATEWAY_MODEL;
  const accountFetch = globalThis.fetch;
  let status = 200, output: unknown = { explanation: 'Setiap kelompok berisi dua satuan, sehingga tiga kelompok memiliki enam satuan. Pengali berlaku pada seluruh isi kelompok.' };
  let malformed = false, fail = false;
  let providerCalls = 0;
  globalThis.fetch = async (input, init) => {
    const req = new Request(input, init);
    if (!req.url.startsWith('https://ai-gateway.vercel.sh/')) return accountFetch(input, init);
    providerCalls++;
    const data = await req.json();
    const context = JSON.parse(data.messages[1].content);
    assert.equal(context.selectedPassage.text, catalog.videos[0].transcript[1].text);
    assert.equal(context.studentQuestion, command.question);
    assert.equal(context.approvedExplanation, explanations['distribution-v1'][1]);
    assert.equal(req.headers.get('authorization'), 'Bearer test-key');
    assert.equal(data.response_format.json_schema.schema.required[0], 'explanation');
    if (fail) throw new TypeError('network error');
    if (status !== 200) return new Response('{}', { status });
    return Response.json({ choices: [{ finish_reason: 'stop', message: { reasoning: 'private reasoning', content: malformed ? '{' : JSON.stringify(output) } }] });
  };
  process.env.AI_GATEWAY_API_KEY = 'test-key';
  process.env.AI_GATEWAY_MODEL = 'deepseek/test-model';
  try {
    const good = await (await POST(request(command))).json();
    assert.equal(good.source, 'gateway');
    assert.equal('reason' in good, false);
    assert.ok(!JSON.stringify(good).includes('private reasoning'));
    for (const bad of [{ explanation: 'short' }, { explanation: 'Read https://evil.example to get the answer.' }, { explanation: 'A long enough explanation.', mastery: 'understood' }, { explanation: '<script>alert(1)</script> Here is some text.' }]) {
      output = bad;
      assert.equal((await (await POST(request(command))).json()).reason, 'invalid-response');
    }
    malformed = true;
    assert.equal((await (await POST(request(command))).json()).reason, 'invalid-response');
    malformed = false;
    for (const [providerStatus, reason] of [[401, 'invalid-api-key'], [402, 'credits-exhausted'], [403, 'model-access-denied'], [429, 'rate-limited'], [500, 'provider-unavailable']] as const) {
      status = providerStatus;
      assert.equal((await (await POST(request(command))).json()).reason, reason);
    }
    status = 200; fail = true;
    assert.equal((await (await POST(request(command))).json()).source, 'curated');
    const before = providerCalls;
    await POST(request(command, null));
    assert.equal(providerCalls, before);
    process.env.AI_GATEWAY_MODEL = '../invalid';
    assert.equal((await (await POST(request(command))).json()).reason, 'invalid-configuration');
    assert.equal(providerCalls, before);
  } finally {
    mock.restore();
    if (savedModel === undefined) delete process.env.AI_GATEWAY_MODEL; else process.env.AI_GATEWAY_MODEL = savedModel;
  }
});

test('every transcript passage has a useful curated explanation and math output is allowed', () => {
  for (const video of catalog.videos) {
    const examples = explanations[video.id as keyof typeof explanations];
    assert.equal(examples.length, video.transcript.length);
    for (const explanation of examples) assert.equal(validVideoExplanation({ explanation }), true);
    for (let cueIndex = 0; cueIndex < video.transcript.length; cueIndex++) assert.equal(parseVideoHelp({ videoId: video.id, videoVersion: video.version, cueIndex, question: '  Jelaskan lagi. ' }).question, 'Jelaskan lagi.');
  }
  assert.equal(validVideoExplanation({ explanation: 'Untuk h ≠ 0, [(1 + h)² − 1]/h = 2 + h. Saat h mendekati nol, gradien mendekati 2.' }), true);
});
