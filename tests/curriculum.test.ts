import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST, OPTIONS } from '../app/api/curriculum/route.ts';
import { materials } from '../lib/curriculum.ts';
import { newSession } from '../lib/engine.ts';
import { mockSupabase, userA, userB } from './helpers.ts';

test('SMA API verifies pretests, grades server-side, isolates accounts and rejects stale revisions', async () => {
  const mock = mockSupabase();
  const originalMock = globalThis.fetch;
  type Row = { user_id: string; module_id: string; completed: boolean; attempts: number; revision: number };
  const progress = new Map<string, Row>();
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init), url = new URL(request.url);
    if (url.pathname === '/rest/v1/curriculum_progress') {
      assert.equal(request.headers.get('apikey'), 'sb_secret_test');
      const owner = url.searchParams.get('user_id')?.slice(3);
      return reply([...progress.values()].filter(row => row.user_id === owner));
    }
    if (url.pathname === '/rest/v1/rpc/save_curriculum_progress') {
      assert.equal(request.headers.get('apikey'), 'sb_secret_test');
      const body = await request.json();
      const key = `${body.p_user_id}:${body.p_module_id}`, previous = progress.get(key);
      if ((previous?.revision || 0) !== body.p_expected_revision) return reply({ message: 'revision_conflict' }, 400);
      const row = { user_id: body.p_user_id, module_id: body.p_module_id, completed: previous?.completed === true || body.p_correct, attempts: (previous?.attempts || 0) + 1, revision: (previous?.revision || 0) + 1 };
      progress.set(key, row);
      return reply(row);
    }
    return originalMock(input, init);
  };
  const material = materials[0], wrong = material.quiz.options.find(o => o.id !== material.quiz.correctOption)!.id;
  const req = (body?: unknown, token = 'user-a') => new Request('http://localhost:3001/api/curriculum', { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token}`, Origin: 'https://learn.example.com', 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const command = { moduleId: material.id, answerId: wrong, expectedRevision: 0, completed: true, correct: true, user_id: userB };
  const finish = (concept: 'distribution' | 'inverse') => mock.rows.set(`${userA}:${concept}`, { user_id: userA, concept, session: { ...newSession(concept), stage: 'complete' }, revision: 1 });
  try {
    assert.equal((await GET(req(undefined, 'invalid'))).status, 401);
    assert.equal((await POST(req(command))).status, 403);
    assert.equal((await (await GET(req())).json()).unlocked, false);
    finish('distribution');
    assert.equal((await POST(req(command))).status, 403);
    finish('inverse');
    const catalogue = await (await GET(req())).json();
    assert.equal(catalogue.unlocked, true);
    assert.equal(catalogue.modules.length, 37);
    assert.equal(catalogue.curriculumVersion, '2026.10.21-v2');
    assert.equal(catalogue.tracks.length, 2);
    assert.equal(catalogue.modules.filter((m: { track: string }) => m.track === 'advanced').length, 12);
    assert.equal('correctOption' in catalogue.modules[0].quiz, false);
    const failed = await (await POST(req(command))).json();
    assert.equal(failed.correct, false);
    assert.equal(failed.progress.completed, false);
    assert.equal(progress.has(`${userB}:${material.id}`), false);
    const correct = { ...command, answerId: material.quiz.correctOption, expectedRevision: 1 };
    const responses = await Promise.all([POST(req(correct)), POST(req(correct))]);
    assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
    const complete = await (await GET(req())).json();
    assert.equal(complete.progress[0].completed, true);
    assert.equal(complete.progress[0].attempts, 2);
    const other = await (await GET(req(undefined, 'user-b'))).json();
    assert.deepEqual(other.progress, []);
    const retry = await (await POST(req({ ...command, expectedRevision: 2 }))).json();
    assert.equal(retry.correct, false);
    assert.equal(retry.progress.completed, true);
    for (const body of [{ ...command, answerId: 'unknown' }, { ...command, moduleId: 'unknown' }, { ...command, expectedRevision: -1 }]) assert.equal((await POST(req(body))).status, 400);
    for (const id of ['x-inequalities','x-exponential-functions','advanced-limits','advanced-derivatives','advanced-integrals']) {
      const lesson = materials.find(m => m.id === id)!;
      const wrongAnswer = lesson.quiz.options.find(o => o.id !== lesson.quiz.correctOption)!.id;
      const failed = await (await POST(req({ moduleId: id, answerId: wrongAnswer, expectedRevision: 0, correct: true }))).json();
      assert.equal(failed.correct, false);
      const passed = await (await POST(req({ moduleId: id, answerId: lesson.quiz.correctOption, expectedRevision: 1 }))).json();
      assert.equal(passed.correct, true); assert.equal(passed.progress.completed, true);
    }
    const preflight = await OPTIONS(new Request('http://localhost:3001/api/curriculum', { method: 'OPTIONS', headers: { Origin: 'https://learn.example.com', 'Access-Control-Request-Method': 'POST' } }));
    assert.equal(preflight.status, 204);
  } finally { mock.restore(); }
});
