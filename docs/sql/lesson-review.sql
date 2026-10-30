-- Personal spaced review for the self-introduction sample course.
create table public.aunora_review_items (
 user_id uuid not null references auth.users(id) on delete cascade,
 task_id text not null,
 due_at timestamptz not null,
 streak integer not null default 0 check(streak between 0 and 5),
 last_correct boolean not null,
 last_assisted boolean not null,
 updated_at timestamptz not null default now(),
 primary key(user_id,task_id)
);
alter table public.aunora_review_items enable row level security;
revoke all on public.aunora_review_items from anon,authenticated;
grant select,insert,update on public.aunora_review_items to authenticated;
create policy "Read own review items" on public.aunora_review_items for select to authenticated using ((select auth.uid())=user_id);
create policy "Insert own review items" on public.aunora_review_items for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Update own review items" on public.aunora_review_items for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create index aunora_review_due on public.aunora_review_items(user_id,due_at);