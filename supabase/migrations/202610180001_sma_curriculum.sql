begin;

create table public.curriculum_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null check (module_id in ('x-exponents', 'x-linear', 'x-quadratic', 'x-trigonometry', 'x-statistics', 'x-probability', 'xi-functions', 'xi-composition', 'xi-transformations', 'xi-circles', 'xi-bivariate', 'xi-regression', 'xii-sequences', 'xii-interest', 'xii-annuities', 'xii-counting', 'xii-combinatorics', 'xii-compound-probability')),
  completed boolean not null default false,
  attempts integer not null check (attempts > 0),
  revision integer not null check (revision > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);
alter table public.curriculum_progress enable row level security;
revoke all on public.curriculum_progress from public, anon, authenticated;
grant all on public.curriculum_progress to service_role;
-- Only the backend grades answers and reads account-owned progress.

create function public.save_curriculum_progress(p_user_id uuid, p_module_id text, p_expected_revision integer, p_correct boolean)
returns setof public.curriculum_progress
language plpgsql security definer set search_path = '' as $$
begin
  -- Lock both pretests while checking access so a concurrent reset cannot bypass the gate.
  perform 1 from public.learning_progress where user_id = p_user_id
    and concept in ('distribution', 'inverse') order by concept for share;
  if (select count(*) from public.learning_progress where user_id = p_user_id
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
revoke all on function public.save_curriculum_progress(uuid, text, integer, boolean) from public, anon, authenticated;
grant execute on function public.save_curriculum_progress(uuid, text, integer, boolean) to service_role;

commit;
