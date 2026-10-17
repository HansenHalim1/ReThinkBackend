import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectAdaptiveProbe } from '../lib/diagnostic.ts';
import { newSession } from '../lib/engine.ts';

test('adaptive diagnosis sends evidence to Gemini and accepts only a banked probe', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.GEMINI_MODEL;
  const previousFetch = globalThis.fetch;
  let requestBody: Record<string, any> | undefined;
  try {
    process.env.GEMINI_API_KEY = 'test-only-key';
    process.env.GEMINI_MODEL = 'gemini-test-model';
    globalThis.fetch = async (_input, init) => {
      requestBody = JSON.parse(String(init?.body));
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ hypothesis: 'possible-slip', nextProbeId: 'distribution-probe-symbolic' }) }] } }] });
    };

    const result = await selectAdaptiveProbe(newSession('distribution'), '3x+2', 'Saya hanya mengalikan x.');
    assert.equal(result?.ai.source, 'gemini');
    assert.equal(result?.selection.hypothesis, 'possible-slip');
    assert.equal(result?.selection.questionId, 'distribution-probe-symbolic');
    const evidence = JSON.parse(requestBody!.contents[0].parts[0].text);
    assert.equal(evidence.evidence[0].answer, '3x+2');
    assert.equal(evidence.evidence[0].reasoning, 'Saya hanya mengalikan x.');
    assert.ok(evidence.candidates.some((candidate: { id: string }) => candidate.id === result?.selection.questionId));
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = previousModel;
  }
});
