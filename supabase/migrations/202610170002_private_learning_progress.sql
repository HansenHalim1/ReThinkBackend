begin;

revoke all on public.learning_progress from anon, authenticated;
drop policy if exists progress_read_own on public.learning_progress;

commit;
