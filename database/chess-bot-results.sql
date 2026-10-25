-- Server-verified bot wins, one row per signed game; direct client writes are forbidden.
create table public.aunora_chess_bot_results (
 game_id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name)<=40),
 difficulty text not null check (difficulty in ('easy','medium','hard','expert')),
 reason text not null check (reason in ('checkmate','timeout')),
 created_at timestamptz not null default now()
);
create index aunora_chess_bot_results_user_idx on public.aunora_chess_bot_results(user_id);
alter table public.aunora_chess_bot_results enable row level security;
revoke all on public.aunora_chess_bot_results from public,anon,authenticated;
grant select,insert on public.aunora_chess_bot_results to service_role;
create or replace function public.aunora_chess_leaderboard()
returns table(user_id uuid,display_name text,wins bigint)
language sql security definer set search_path=public
as $$
 select scores.user_id,coalesce(max(scores.display_name),'Người chơi'),count(*)::bigint
 from (
  select r.winner_id as user_id,case when c.host_id=r.winner_id then c.host_name else c.guest_name end as display_name
  from public.aunora_chess_results r join public.aunora_chess_rooms c on c.code=r.room_code where r.winner_id is not null
  union all
  select b.user_id,b.display_name from public.aunora_chess_bot_results b
 ) scores
 group by scores.user_id order by count(*) desc,scores.user_id limit 50
$$;

create policy server_only_bot_results on public.aunora_chess_bot_results for all to service_role using (true) with check (true);
