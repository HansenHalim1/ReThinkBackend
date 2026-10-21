import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiConfig, DEFAULT_AI_MODEL, generateStructured } from '../lib/ai.ts';
import { mockSupabase } from './helpers.ts';
import { POST as feedback } from '../app/api/feedback/route.ts';

const prompt = { system: 'Return a JSON object.', context: { question: 'Why?' }, schema: { type: 'object', properties: { explanation: { type: 'string' } }, required: ['explanation'], additionalProperties: false }, maxOutputTokens: 256, timeoutMs: 1000 };

test('all AI uses Gateway credentials; old Gemini keys never trigger calls or fallback', async () => {
  const mock = mockSupabase();
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw Error('No network expected'); };
  try {
    process.env.GEMINI_API_KEY = 'legacy-key-must-not-be-used';
    assert.equal(aiConfig().configured, false);
    assert.equal(aiConfig().model, DEFAULT_AI_MODEL);
    assert.deepEqual(await generateStructured(prompt), { ok: false, reason: 'not-configured', model: DEFAULT_AI_MODEL });
    process.env.AI_GATEWAY_API_KEY = 'gateway-test-key';
    process.env.AI_GATEWAY_MODEL = 'google/gemini-test';
    assert.equal(aiConfig().valid, false);
    const invalid = await generateStructured(prompt);
    assert.equal(invalid.ok, false);
    if (!invalid.ok) assert.equal(invalid.reason, 'invalid-configuration');
    assert.equal(calls, 0);
  } finally { mock.restore(); }
});

test('Gateway transport caps output, uses structured JSON, ignores reasoning and handles budget/access failures without retry', async () => {
  const mock = mockSupabase();
  let calls = 0, status = 200;
  let payload: unknown = { choices: [{ finish_reason: 'stop', message: { reasoning: 'private', content: '{"explanation":"A useful explanation."}' } }] };
  let seenAuth = '';
  process.env.AI_GATEWAY_API_KEY = 'key-first';
  process.env.VERCEL_OIDC_TOKEN = 'oidc-second';
  globalThis.fetch = async (input, init) => {
    calls++;
    assert.equal(String(input), 'https://ai-gateway.vercel.sh/v1/chat/completions');
    seenAuth = new Headers(init?.headers).get('authorization')!;
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, DEFAULT_AI_MODEL);
    assert.equal(body.stream, false);
    assert.equal(body.max_tokens, 256);
    assert.deepEqual(body.reasoning, { effort: 'none', exclude: true });
    assert.equal(body.response_format.type, 'json_schema');
    assert.deepEqual(JSON.parse(body.messages[1].content), prompt.context);
    return Response.json(payload, { status });
  };
  try {
    const good = await generateStructured(prompt);
    assert.equal(good.ok, true);
    assert.equal(seenAuth, 'Bearer key-first');
    assert.ok(!JSON.stringify(good).includes('private'));
    delete process.env.AI_GATEWAY_API_KEY;
    assert.equal((await generateStructured(prompt)).ok, true);
    assert.equal(seenAuth, 'Bearer oidc-second');
    for (const [s, reason] of [[401, 'invalid-api-key'], [402, 'credits-exhausted'], [403, 'model-access-denied'], [429, 'rate-limited'], [500, 'provider-unavailable']] as const) {
      status = s;
      const before = calls;
      const result = await generateStructured(prompt);
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.reason, reason);
      assert.equal(calls, before + 1);
    }
    status = 200;
    for (const bad of [{}, { choices: [{ finish_reason: 'length', message: { content: '{}' } }] }, { choices: [{ message: { content: 'invalid JSON' } }] }, { choices: [{ message: { content: '{}', refusal: 'refused' } }] }]) {
      payload = bad;
      const result = await generateStructured(prompt);
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.reason, 'invalid-response');
    }
    globalThis.fetch = async () => { throw new TypeError('connection lost'); };
    assert.equal((await generateStructured(prompt)).ok, false);
  } finally { mock.restore(); }
});

test('authenticated feedback uses DeepSeek and retains mathematical output guards', async () => {
  const mock = mockSupabase();
  const accountFetch = globalThis.fetch;
  let output: unknown = { feedback: 'Ceritakan bagaimana kamu membagikan pengali ke setiap suku.' };
  process.env.AI_GATEWAY_API_KEY = 'test-key';
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith('https://ai-gateway.vercel.sh/')) return Response.json({ choices: [{ message: { content: JSON.stringify(output) } }] });
    return accountFetch(input, init);
  };
  const request = () => new Request('https://api.example.com/api/feedback', { method: 'POST', headers: { Authorization: 'Bearer user-a', 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: 'distribution-diagnosis', answer: '3x+2', reasoning: '' }) });
  try {
    const response = await feedback(request());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).source, 'gateway');
    output = { feedback: 'Jawabannya adalah 3x + 6.' };
    const guarded = await (await feedback(request())).json();
    assert.equal(guarded.source, 'curated');
    assert.equal(guarded.reason, 'invalid-response');
  } finally { mock.restore(); }
});
