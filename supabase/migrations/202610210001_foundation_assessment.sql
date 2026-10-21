begin;
create table public.foundation_assessments (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session jsonb not null check (coalesce(jsonb_typeof(session) = 'object' and session->>'bankVersion' = 'foundation-2026.10.21-v1' and jsonb_typeof(session->'answers') = 'array' and jsonb_array_length(session->'answers') between 0 and 24, false)),
  completed boolean generated always as (jsonb_array_length(session->'answers') = 24) stored,
  revision integer not null check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.foundation_assessments enable row level security;
revoke all on public.foundation_assessments from public, anon, authenticated;
grant all on public.foundation_assessments to service_role;
create function public.save_foundation_assessment(p_user_id uuid, p_expected_revision integer, p_session jsonb)
returns setof public.foundation_assessments
language plpgsql security definer set search_path = '' as $$
begin
  if p_expected_revision = 0 then
    return query insert into public.foundation_assessments(user_id, session, revision)
      values (p_user_id, p_session, 1) on conflict (user_id) do nothing returning *;
  else
    return query update public.foundation_assessments set session = p_session, revision = revision + 1, updated_at = now()
      where user_id = p_user_id and revision = p_expected_revision returning *;
  end if;
  if not found then raise exception 'revision_conflict' using errcode = 'P0001'; end if;
end;
$$;
revoke all on function public.save_foundation_assessment(uuid, integer, jsonb) from public, anon, authenticated;
grant execute on function public.save_foundation_assessment(uuid, integer, jsonb) to service_role;
create or replace function public.save_curriculum_progress(p_user_id uuid, p_module_id text, p_expected_revision integer, p_correct boolean)
returns setof public.curriculum_progress
language plpgsql security definer set search_path = '' as $$
begin
  -- Lock both pretests while checking access so a concurrent reset cannot bypass the gate.
  perform 1 from public.learning_progress where user_id = p_user_id
    and concept in ('distribution', 'inverse') order by concept for share;
  perform 1 from public.foundation_assessments where user_id = p_user_id for share;
  if not exists (select 1 from public.foundation_assessments where user_id = p_user_id and completed)
    and (select count(*) from public.learning_progress where user_id = p_user_id
      and concept in ('distribution', 'inverse') and session->>'stage' = 'complete') <> 2 then
    raise exception 'pretests_required' using errcode = 'P0001';
  end if;
  if p_expected_revision = 0 then
    return query insert into public.curriculum_progress (user_id, module_id, completed, attempts, revision)
      values (p_user_id, p_module_id, p_correct, 1, 1)
      on conflict (user_id, module_id) do nothing returning *;
  else
    return query update public.curriculum_progress set completed = completed or p_correct,
      attempts = attempts + 1, revision = revision + 1, updated_at = now()
      where user_id = p_user_id and module_id = p_module_id and revision = p_expected_revision returning *;
  end if;
  if not found then raise exception 'revision_conflict' using errcode = 'P0001'; end if;
end;
$$;

commit;
