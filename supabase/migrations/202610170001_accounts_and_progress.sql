begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  created_at timestamptz not null default now()
);
create table public.learning_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  concept text not null check (concept in ('distribution', 'inverse')),
  session jsonb not null check (jsonb_typeof(session) = 'object' and session->>'concept' = concept),
  revision integer not null check (revision > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, concept)
);

alter table public.profiles enable row level security;
alter table public.learning_progress enable row level security;
revoke all on public.profiles, public.learning_progress from anon, authenticated;
grant select on public.profiles, public.learning_progress to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant all on public.profiles, public.learning_progress to service_role;
create policy profiles_read_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy progress_read_own on public.learning_progress for select to authenticated using ((select auth.uid()) = user_id);
-- Authenticated clients cannot write progress directly. Only verified backend commands can do that.

create function public.rethink_create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', ''), 80));
  return new;
end;
$$;
revoke all on function public.rethink_create_profile() from public, anon, authenticated;
create trigger rethink_user_created after insert on auth.users for each row execute function public.rethink_create_profile();
insert into public.profiles (id, display_name)
select id, left(coalesce(raw_user_meta_data->>'display_name', ''), 80) from auth.users on conflict (id) do nothing;

create function public.save_learning_progress(p_user_id uuid, p_concept text, p_expected_revision integer, p_session jsonb)
returns setof public.learning_progress
language plpgsql security definer set search_path = '' as $$
begin
  if p_expected_revision = 0 then
    return query insert into public.learning_progress (user_id, concept, session, revision)
      values (p_user_id, p_concept, p_session, 1) on conflict (user_id, concept) do nothing returning *;
  else
    return query update public.learning_progress set session = p_session, revision = revision + 1, updated_at = now()
      where user_id = p_user_id and concept = p_concept and revision = p_expected_revision returning *;
  end if;
  if not found then raise exception 'revision_conflict' using errcode = 'P0001'; end if;
end;
$$;
revoke all on function public.save_learning_progress(uuid, text, integer, jsonb) from public, anon, authenticated;
grant execute on function public.save_learning_progress(uuid, text, integer, jsonb) to service_role;

commit;
