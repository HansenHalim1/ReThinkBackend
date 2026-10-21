import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { materials, publicMaterial, curriculumVersion, curriculumTracks } from '../lib/curriculum.ts';

test('curriculum v2 preserves all legacy checkpoints while adding reviewed general/advanced lesson structure', async () => {
  const legacy = JSON.parse(await readFile(new URL('./fixtures/curriculum-v1-checkpoints.json', import.meta.url), 'utf8'));
  assert.equal(Object.keys(legacy).length, 18);
  for (const [id, quiz] of Object.entries(legacy)) assert.deepEqual(materials.find(m => m.id === id)?.quiz, quiz, `Changed saved checkpoint ${id}`);
  assert.equal(materials.length, 37);
  assert.equal(materials.filter(m => m.track === 'general').length, 25);
  assert.equal(materials.filter(m => m.track === 'advanced').length, 12);
  assert.equal(curriculumVersion, '2026.10.21-v2');
  assert.equal(curriculumTracks.length, 2);
  const ids = new Set(['distribution', 'inverse', ...materials.map(m => m.id)]);
  const visited = new Set<string>();
  const visit = (id: string, path: string[] = []) => {
    assert.ok(!path.includes(id), `Prerequisite cycle ${path.join(' → ')} → ${id}`);
    if (visited.has(id)) return;
    for (const prerequisite of materials.find(m => m.id === id)?.prerequisites || []) { assert.ok(ids.has(prerequisite)); visit(prerequisite, [...path,id]); }
    visited.add(id);
  };
  for (const m of materials) {
    visit(m.id);
    assert.ok([10,11,12].includes(m.grade)); assert.equal(m.gradePlacement, 'suggested');
    assert.ok(m.explanation.length >= 3 && m.additionalExamples.length >= 1 && m.commonMistakes.length >= 1);
    for (const e of [m.example, ...m.additionalExamples]) assert.ok(e.problem.trim() && e.steps.length >= 3);
    assert.equal(m.quiz.options.length, 4); assert.equal(new Set(m.quiz.options.map(o => o.text)).size, 4);
    assert.equal(m.quiz.options.filter(o => o.id === m.quiz.correctOption).length, 1);
    if (m.track === 'advanced') assert.equal(m.phase, 'F');
    if (m.alignment.kind === 'cp-topic') { assert.equal(m.alignment.verification, 'cp-text-checked'); assert.ok(m.alignment.pdfPages?.length); }
    assert.ok(!('correctOption' in publicMaterial(m).quiz)); assert.ok(!('explanation' in publicMaterial(m).quiz));
    assert.equal(publicMaterial(m).contentVersion, curriculumVersion);
  }
  const bankTopics = new Set(materials.flatMap(m => m.bankTopicIds));
  assert.equal(bankTopics.size, 34, 'Map every non-foundation topic in the draft bank without releasing it as an assessment');
  for (const id of ['x-inequalities','x-exponential-functions','x-quartiles','x-scatterplots','xi-inverse-functions','xii-geometric-series','xii-conditional-probability','advanced-limits','advanced-derivatives','advanced-integrals']) assert.ok(materials.some(m => m.id === id));
  // Independently checked pilot examples/checkpoints; legacy keys are protected above.
  const answers: Record<string,string> = { 'x-inequalities':'(2, 2)', 'x-exponential-functions':String(100*2**3), 'x-quartiles':String(10-4), 'xii-geometric-series':String(4/(1-.5)), 'advanced-matrices':String(2*4-1*3), 'advanced-conics':String(Math.sqrt(25)), 'advanced-binomial':String(10*.3), 'advanced-normal':'0', 'advanced-limits':String(3*2+1), 'advanced-derivative-applications':'7 m/s', 'advanced-integrals':'1' };
  for (const [id,text] of Object.entries(answers)) { const m=materials.find(m=>m.id===id)!; assert.equal(m.quiz.options.find(o=>o.id===m.quiz.correctOption)?.text,text); }
});
