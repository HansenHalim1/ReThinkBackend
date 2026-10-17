import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { newSession } from '../lib/engine.ts';
import { userA, userB } from './helpers.ts';

test('Postgres migration enforces profile ownership, progress permissions and revision checks', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
      create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
    await db.query('insert into auth.users(id,raw_user_meta_data) values ($1,$2)', [userA, { display_name: 'Existing user' }]);
    await db.exec(await readFile(new URL('../supabase/migrations/202610170001_accounts_and_progress.sql', import.meta.url), 'utf8'));
    await db.query('insert into auth.users(id,raw_user_meta_data) values ($1,$2)', [userB, { display_name: 'B'.repeat(100) }]);
    const profiles = await db.query<{ display_name: string }>('select display_name from public.profiles order by id');
    assert.equal(profiles.rows[0].display_name, 'Existing user');
    assert.equal(profiles.rows[1].display_name.length, 80);
    const save = 'select * from public.save_learning_progress($1,$2,$3,$4)';
    const session = newSession('distribution');
    await db.exec('set role service_role');
    const first = await db.query<{ revision: number }>(save, [userA, 'distribution', 0, session]);
    assert.equal(first.rows[0].revision, 1);
    await assert.rejects(db.query(save, [userA, 'distribution', 0, session]), /revision_conflict/);
    const second = await db.query<{ revision: number }>(save, [userA, 'distribution', 1, session]);
    assert.equal(second.rows[0].revision, 2);
    await assert.rejects(db.query(save, [userA, 'distribution', 1, session]), /revision_conflict/);
    await db.exec('reset role; set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userB]);
    assert.equal((await db.query('select * from public.learning_progress')).rows.length, 0);
    assert.equal((await db.query('select * from public.profiles')).rows.length, 1);
    assert.equal((await db.query('update public.profiles set display_name=$1 where id=$2 returning id', ['Hijacked', userA])).rows.length, 0);
    await assert.rejects(db.query(save, [userB, 'distribution', 0, session]), /permission denied/);
    await assert.rejects(db.query('insert into public.learning_progress values($1,$2,$3,1,now())', [userB, 'distribution', session]), /permission denied/);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userA]);
    assert.equal((await db.query('select * from public.learning_progress')).rows.length, 1);
    await db.exec('reset role; set role anon');
    await assert.rejects(db.query('select * from public.learning_progress'), /permission denied/);
    await db.exec('reset role');
    await db.query('delete from auth.users where id=$1', [userA]);
    assert.equal((await db.query('select * from public.learning_progress')).rows.length, 0);
  } finally { await db.close(); }
});
