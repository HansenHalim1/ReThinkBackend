import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectAdaptiveProbe } from '../lib/diagnostic.ts';
import { newSession } from '../lib/engine.ts';
import { aiFailureReason } from '../lib/ai.ts';

test('AI Gateway authentication failures are not labeled as timeouts', () => {
  assert.equal(aiFailureReason(401), 'invalid-api-key');
  assert.equal(aiFailureReason(429), 'rate-limited');
  assert.equal(aiFailureReason(503), 'provider-unavailable');
});

test('adaptive diagnosis sends evidence to AI Gateway and accepts only a banked probe', async () => {
  const previousKey = process.env.AI_GATEWAY_API_KEY;
  const previousModel = process.env.AI_GATEWAY_MODEL;
  const previousFetch = globalThis.fetch;
  let requestBody: Record<string, any> | undefined;
  try {
    process.env.AI_GATEWAY_API_KEY = 'test-only-key';
    process.env.AI_GATEWAY_MODEL = 'deepseek/test-model';
    globalThis.fetch = async (_input, init) => {
      requestBody = JSON.parse(String(init?.body));
      return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ hypothesis: 'possible-slip', nextProbeId: 'distribution-probe-symbolic' }) } }] });
    };

    const result = await selectAdaptiveProbe(newSession('distribution'), '3x+2', 'Saya hanya mengalikan x.');
    assert.equal(result?.ai.source, 'gateway');
    assert.equal(result?.selection.hypothesis, 'possible-slip');
    assert.equal(result?.selection.questionId, 'distribution-probe-symbolic');
    const evidence = JSON.parse(requestBody!.messages[1].content);
    assert.equal(evidence.evidence[0].answer, '3x+2');
    assert.equal(evidence.evidence[0].reasoning, 'Saya hanya mengalikan x.');
    assert.ok(evidence.candidates.some((candidate: { id: string }) => candidate.id === result?.selection.questionId));
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.AI_GATEWAY_MODEL;
    else process.env.AI_GATEWAY_MODEL = previousModel;
  }
});
