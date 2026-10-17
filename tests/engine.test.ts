import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, grade, newSession, reinforce, submit } from '../lib/engine.ts';
import { getConcept } from '../lib/content.ts';
import { equivalent, parseLinear } from '../lib/math.ts';
import { validFeedback } from '../lib/feedback.ts';

test('linear checker accepts equivalent forms and rejects unsupported or executable input', () => {
  for (const answer of ['6+3x', '3*x+6', 'x+x+x+6', '6x/2+6', '3(x+2)']) assert.equal(equivalent(answer, '3x+6', 'expression'), true);
  assert.equal(equivalent('3x+2', '3x+6', 'expression'), false);
  assert.equal(equivalent('x = 6/2', '3', 'number'), true);
  assert.equal(equivalent('3,0', '3', 'number'), true);
  for (const answer of ['alert(1)', 'x*x', '1/0', '(x+2', '2**3', 'NaN', '', 'x/x', '1e100']) assert.equal(parseLinear(answer), null);
});
test('matching errors require a probe before confirmation and complete the guided loop', () => {
  let s = submit(newSession('distribution'), '3x+2', '')!;
  assert.equal(s.diagnosis, 'suspected'); assert.equal(s.stage, 'probe');
  s = submit(s, '4x+3', '')!;
  assert.equal(s.diagnosis, 'confirmed'); assert.equal(s.stage, 'visual');
  s = advance(advance(s)); assert.equal(s.stage, 'practice');
  s = submit(s, '2', '')!; assert.equal(s.stage, 'practice');
  s = submit(s, '10', '')!; assert.equal(s.stage, 'retry');
  s = submit(s, '20+4x', '')!; assert.equal(s.stage, 'transfer');
  s = submit(s, '12+3x', '')!; assert.equal(s.mastery, 'understood'); assert.equal(s.stage, 'complete');
});
test('ambiguous responses get another probe; repeated error patterns confirm and repeated correct answers reject', () => {
  let s = submit(newSession('distribution'), '7', '')!;
  s = submit(s, '4x+3', '')!; assert.equal(s.stage, 'probe');
  s = submit(s, '3x+5', '')!; assert.equal(s.diagnosis, 'confirmed'); assert.equal(s.stage, 'visual');
  s = submit(newSession('inverse'), '13', '')!; s = submit(s, '4', '')!; assert.equal(s.stage, 'probe'); s = submit(s, '4', '')!;
  assert.equal(s.diagnosis, 'rejected'); assert.equal(s.stage, 'retry');
});
test('independent failure stops transfer, transfer failure is procedural only', () => {
  let s = submit(newSession('inverse'), '3', '')!;
  s = submit(s, '4', '')!; s = submit(s, '19', '')!; assert.equal(s.stage, 'complete'); assert.equal(s.mastery, 'needs-reinforcement');
  assert.equal(reinforce(s).stage, 'visual');
  s = submit(newSession('inverse'), '3', '')!;
  s = submit(s, '4', '')!; s = submit(s, '5', '')!; s = submit(s, '17', '')!;
  assert.equal(s.mastery, 'procedural-only');
});
test('invalid math does not record attempts or advance stages', () => {
  const s = newSession('inverse'); assert.equal(submit(s, 'hello', ''), null); assert.equal(s.attempts.length, 0);
  assert.equal(submit({ ...s, stage: 'visual' }, '3', ''), null);
  assert.equal(grade(getConcept('distribution').questions.diagnosis, '3(x+2)'), null);
});
test('AI output guard rejects leaked math, extra control fields and malformed schema', () => {
  assert.equal(validFeedback({ feedback: 'Coba perhatikan setiap suku di dalam kurung.' }), true);
  for (const v of [{ feedback: 'Jawabannya 3x + 6' }, { feedback: 'Lanjut belajar ya.', stage: 'complete' }, { feedback: 2 }, { feedback: 'ok' }, { feedback: 'x = jawaban akhir' }]) assert.equal(validFeedback(v), false);
});
