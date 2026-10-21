import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { assessmentCommand, freshAssessment, questions } from '../lib/assessment.ts';
import { userA, userB } from './helpers.ts';

test('unified assessment migration protects records, enforces revisions and unlocks curriculum only after completion', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
      create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
    for (const file of ['202610170001_accounts_and_progress.sql','202610170002_private_learning_progress.sql','202610180001_sma_curriculum.sql','202610210001_foundation_assessment.sql','202610210002_curriculum_v2.sql']) await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'));
    await db.query('insert into auth.users(id) values ($1),($2)', [userA, userB]);
    const save = 'select * from public.save_foundation_assessment($1,$2,$3)';
    const material = 'select * from public.save_curriculum_progress($1,$2,$3,$4)';
    let session = freshAssessment();
    await db.exec('set role service_role');
    await assert.rejects(db.query(save, [userB, 0, {}]), /check constraint/);
    session = assessmentCommand(session, { action: 'answer', questionId: questions[0].id, optionId: '__unsure' });
    const first = await db.query<{ revision: number; completed: boolean }>(save, [userB, 0, session]);
    assert.equal(first.rows[0].revision, 1); assert.equal(first.rows[0].completed, false);
    await assert.rejects(db.query(save, [userB, 0, session]), /revision_conflict/);
    await assert.rejects(db.query(material, [userB, 'x-exponents', 0, true]), /pretests_required/);
    for (let i=1; i<questions.length; i++) session = assessmentCommand(session, { action: 'answer', questionId: questions[i].id, optionId: '__unsure' });
    const finished = await db.query<{ completed: boolean }>(save, [userB, 1, session]);
    assert.equal(finished.rows[0].completed, true);
    await db.query(material, [userB, 'x-exponents', 0, true]);
    for (const id of ['x-inequalities','advanced-limits','advanced-derivatives','advanced-integrals']) await db.query(material, [userB, id, 0, true]);
    await assert.rejects(db.query(material, [userB, 'unrecognized-module', 0, true]), /check constraint/);
    session = assessmentCommand(session, { action: 'review', knownTopicIds: [] });
    const reviewed = await db.query<{ completed: boolean }>(save, [userB, 2, session]);
    assert.equal(reviewed.rows[0].completed, true);
    await assert.rejects(db.query(material, [userA, 'x-exponents', 0, true]), /pretests_required/);
    // Existing foundation-session completions still unlock the revised database gate.
    await db.query('select * from public.save_learning_progress($1,$2,0,$3)', [userA, 'distribution', { stage: 'complete' }]);
    await db.query('select * from public.save_learning_progress($1,$2,0,$3)', [userA, 'inverse', { stage: 'complete' }]);
    await db.query(material, [userA, 'x-exponents', 0, true]);
    for (const role of ['authenticated', 'anon']) {
      await db.exec(`reset role; set role ${role}`);
      await assert.rejects(db.query('select * from public.foundation_assessments'), /permission denied/);
      await assert.rejects(db.query(save, [userB, 3, session]), /permission denied/);
      await assert.rejects(db.query('update public.foundation_assessments set revision=999'), /permission denied/);
    }
    await db.exec('reset role');
    await db.query('delete from auth.users where id=$1', [userB]);
    assert.equal((await db.query('select * from public.foundation_assessments')).rows.length, 0);
    assert.equal((await db.query('select * from public.curriculum_progress where user_id=$1', [userB])).rows.length, 0);
  } finally { await db.close(); }
});
