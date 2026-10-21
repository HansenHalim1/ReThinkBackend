import { test } from 'node:test';
import assert from 'node:assert/strict';
import { questions, topics, assessmentCommand, assessmentView, freshAssessment, readAssessment, type AssessmentSession } from '../lib/assessment.ts';
import { GET, POST, OPTIONS } from '../app/api/assessment/route.ts';
import { GET as demoGet, POST as demoPost } from '../app/api/assessment-demo/route.ts';
import { GET as curriculumGet } from '../app/api/curriculum/route.ts';
import { mockSupabase, userA, userB } from './helpers.ts';

test('mixed foundation bank covers eight topics with three increasing rounds and no answer keys in learner projections', () => {
  assert.equal(topics.length, 8); assert.equal(questions.length, 24);
  assert.equal(new Set(questions.map(q => q.id)).size, 24);
  const expectedAnswers = ['a','a','b','d','d','c','a','a','a','d','c','c','a','b','d','c','b','c','a','c','c','c','d','d'];
  assert.deepEqual(questions.map(q => q.answer.optionId), expectedAnswers);
  assert.deepEqual(questions.map(q => q.difficulty), [...Array(8).fill(1), ...Array(8).fill(2), ...Array(8).fill(3)]);
  let s = freshAssessment();
  for (const q of questions) {
    const view = assessmentView(s, s.answers.length);
    assert.equal(view.question?.id, q.id);
    for (const field of ['answer', 'explanation', 'distractors', 'correctOption', 'misconception']) assert.ok(!JSON.stringify(view).includes(`"${field}"`));
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options.map(o => o.id)).size, 4);
    assert.ok(q.options.some(o => o.id === q.answer.optionId));
    s = assessmentCommand(s, { action: 'answer', questionId: q.id, optionId: q.answer.optionId });
  }
  assert.equal(assessmentView(s, 24).status, 'complete');
  assert.ok(assessmentView(s, 24).topics.every(t => t.correct === 3 && t.suggestedKnown));
  const reviewed = assessmentCommand(s, { action: 'review', knownTopicIds: [] });
  assert.ok(assessmentView(reviewed, 25).topics.every(t => !t.checked && t.correct === 3 && t.suggestedKnown));
  assert.throws(() => assessmentCommand(reviewed, { action: 'review', knownTopicIds: ['forged-topic'] }));
  assert.throws(() => assessmentCommand(freshAssessment(), { action: 'review', knownTopicIds: [] }));
  assert.throws(() => assessmentCommand(freshAssessment(), { action: 'answer', questionId: questions[1].id, optionId: 'a' }));
  assert.throws(() => readAssessment({ ...freshAssessment(), bankVersion: 'old-version' }));
  s = freshAssessment();
  for (const q of questions) s = assessmentCommand(s, { action: 'answer', questionId: q.id, optionId: '__unsure' });
  assert.ok(assessmentView(s, 24).topics.every(t => t.correct === 0 && !t.checked));
});

test('authenticated assessment saves only server-graded commands, isolates accounts, resumes and rejects conflicting writes', async () => {
  const mock = mockSupabase(); const original = globalThis.fetch;
  type Row = { user_id: string; session: AssessmentSession; revision: number; completed: boolean };
  const rows = new Map<string, Row>();
  const reply = (body: unknown, status = 200) => Response.json(body, { status });
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init), url = new URL(request.url);
    if (url.pathname === '/rest/v1/foundation_assessments') {
      assert.equal(request.headers.get('apikey'), 'sb_secret_test');
      const row = rows.get(url.searchParams.get('user_id')?.slice(3) || '');
      return reply(row ? [row] : []);
    }
    if (url.pathname === '/rest/v1/curriculum_progress') return reply([]);
    if (url.pathname === '/rest/v1/rpc/save_foundation_assessment') {
      assert.equal(request.headers.get('apikey'), 'sb_secret_test');
      const b = await request.json();
      if ((rows.get(b.p_user_id)?.revision || 0) !== b.p_expected_revision) return reply({ message: 'revision_conflict' }, 400);
      const row = { user_id: b.p_user_id, session: b.p_session, revision: b.p_expected_revision + 1, completed: b.p_session.answers.length === 24 };
      rows.set(b.p_user_id, row); return reply(row);
    }
    return original(input, init);
  };
  const req = (body?: unknown, token = 'user-a') => new Request('http://localhost:3001/api/assessment', { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token}`, Origin: 'http://localhost:3000', 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  try {
    assert.equal((await GET(req(undefined, 'invalid'))).status, 401);
    assert.equal((await POST(req({ action: 'answer' }, 'invalid'))).status, 401);
    const start = await (await GET(req())).json();
    assert.equal(start.revision, 0); assert.equal(start.status, 'not-started');
    const body = { action: 'answer', expectedRevision: 0, questionId: questions[0].id, optionId: '__unsure', correct: true, user_id: userB, session: { answers: 'forged' } };
    const responses = await Promise.all([POST(req(body)), POST(req(body))]);
    assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
    assert.equal(rows.has(userB), false);
    assert.equal((await (await GET(req())).json()).answered, 1);
    assert.equal((await (await GET(req(undefined, 'user-b'))).json()).answered, 0);
    assert.equal((await POST(req({ ...body, expectedRevision: 1 }))).status, 400);
    assert.equal((await POST(req({ action: 'review', expectedRevision: 1, knownTopicIds: topics.map(t => t.id) }))).status, 400);
    assert.equal((await (await curriculumGet(req())).json()).unlocked, false);
    for (let i = 1; i < questions.length; i++) assert.equal((await POST(req({ action: 'answer', expectedRevision: i, questionId: questions[i].id, optionId: questions[i].answer.optionId }))).status, 200);
    const complete = await (await GET(req())).json();
    assert.equal(complete.status, 'complete'); assert.equal(complete.topics[0].correct, 2);
    assert.equal((await (await curriculumGet(req())).json()).unlocked, true);
    assert.equal((await POST(req({ action: 'review', expectedRevision: 24, knownTopicIds: [] }))).status, 200);
    const reviewed = await (await GET(req())).json();
    assert.equal(reviewed.checklistSaved, true); assert.ok(reviewed.topics.every((t: { checked: boolean }) => !t.checked));
    assert.equal((await OPTIONS(new Request('http://localhost:3001/api/assessment', { method: 'OPTIONS', headers: { Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } }))).status, 204);
    assert.equal((await POST(new Request('http://localhost:3001/api/assessment', { method: 'POST', headers: { Authorization: 'Bearer user-a' }, body: 'x'.repeat(4200) }))).status, 413);
  } finally { mock.restore(); }
});

test('anonymous assessment demo needs no database or AI, never grants account completion, and rejects forged sequences', async () => {
  const mock = mockSupabase();
  globalThis.fetch = async () => { throw Error('Demo must not call any service'); };
  const req = (body?: unknown) => new Request('http://localhost:3001/api/assessment-demo', { method: body ? 'POST' : 'GET', headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    let view = await (await demoGet(req())).json();
    for (const q of questions) {
      const response = await demoPost(req({ action: 'answer', demoSession: view.demoSession, questionId: q.id, optionId: q.answer.optionId }));
      assert.equal(response.status, 200); view = await response.json();
    }
    assert.equal(view.status, 'complete');
    assert.equal((await demoPost(req({ action: 'answer', demoSession: { ...freshAssessment(), answers: [{ questionId: questions[20].id, optionId: 'a' }] }, questionId: questions[0].id, optionId: 'a' }))).status, 400);
    assert.equal((await (await demoGet(req())).json()).answered, 0);
  } finally { mock.restore(); }
});
