begin;
create table if not exists public.aunora_feature_flags (
 key text primary key check (key in ('ai_tutor_enabled','games_enabled','feedback_enabled','notifications_enabled')),
 enabled boolean not null default true,
 updated_at timestamptz not null default now()
);
insert into public.aunora_feature_flags(key) values ('ai_tutor_enabled'),('games_enabled'),('feedback_enabled'),('notifications_enabled') on conflict do nothing;
alter table public.aunora_feature_flags enable row level security;
create policy "Aunora flags readable" on public.aunora_feature_flags for select to anon,authenticated using (true);
create policy "Aunora admins change flags" on public.aunora_feature_flags for update to authenticated using ((select auth.jwt()->'app_metadata'->>'role')='admin') with check ((select auth.jwt()->'app_metadata'->>'role')='admin');
grant select on public.aunora_feature_flags to anon,authenticated;
grant update(enabled,updated_at) on public.aunora_feature_flags to authenticated;

create table public.aunora_learning_days (
 user_id uuid not null references auth.users(id) on delete cascade,
 lesson_id text not null check (length(lesson_id) between 1 and 100),
 course_id text not null check (length(course_id) between 1 and 100),
 study_date date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
 created_at timestamptz not null default now(),
 primary key (user_id,lesson_id,study_date)
);
create index aunora_learning_days_date_idx on public.aunora_learning_days(study_date,course_id);
alter table public.aunora_learning_days enable row level security;
create policy "Aunora study days read" on public.aunora_learning_days for select to authenticated using ((select auth.uid())=user_id or (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy "Aunora study days insert own" on public.aunora_learning_days for insert to authenticated with check ((select auth.uid())=user_id and study_date=(now() at time zone 'Asia/Ho_Chi_Minh')::date);
grant select on public.aunora_learning_days to authenticated;
grant insert(user_id,lesson_id,course_id) on public.aunora_learning_days to authenticated;
insert into public.aunora_learning_days(user_id,lesson_id,course_id,study_date,created_at)
 select user_id,lesson_id,course_id,(coalesce(completed_at,updated_at) at time zone 'Asia/Ho_Chi_Minh')::date,coalesce(completed_at,updated_at)
 from public.aunora_lesson_progress where completed and coalesce(completed_at,updated_at) is not null on conflict do nothing;
create or replace function public.aunora_record_learning_day() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if new.completed then
  insert into public.aunora_learning_days(user_id,lesson_id,course_id) values(new.user_id,new.lesson_id,new.course_id) on conflict do nothing;
 end if;
 return new;
end $$;
revoke all on function public.aunora_record_learning_day() from public;
create trigger aunora_record_learning_day after insert or update on public.aunora_lesson_progress for each row execute function public.aunora_record_learning_day();
create policy "Aunora admins read lesson progress" on public.aunora_lesson_progress for select to authenticated using ((select auth.jwt()->'app_metadata'->>'role')='admin');

create table public.aunora_learning_activity (
 user_id uuid primary key references auth.users(id) on delete cascade,
 lesson_id text not null check (length(lesson_id) between 1 and 100),
 course_id text not null check (length(course_id) between 1 and 100),
 last_seen_at timestamptz not null default now()
);
alter table public.aunora_learning_activity enable row level security;
create policy "Aunora activity read" on public.aunora_learning_activity for select to authenticated using ((select auth.uid())=user_id or (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy "Aunora activity insert" on public.aunora_learning_activity for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Aunora activity update" on public.aunora_learning_activity for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,insert,update on public.aunora_learning_activity to authenticated;
create or replace function public.aunora_activity_clock() returns trigger language plpgsql security invoker set search_path=public as $$ begin new.last_seen_at=now(); return new; end $$;
revoke all on function public.aunora_activity_clock() from public;
create trigger aunora_activity_clock before insert or update on public.aunora_learning_activity for each row execute function public.aunora_activity_clock();

create table public.aunora_feedback (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 category text not null check(category in ('lesson_error','bug','suggestion')),
 title text not null check(length(title) between 3 and 120), message text not null check(length(message) between 10 and 3000),
 page_path text not null default '/learn' check(length(page_path)<=200 and page_path like '/learn%'),
 status text not null default 'new' check(status in ('new','in_progress','resolved')),
 reply text not null default '' check(length(reply)<=2000), created_at timestamptz not null default now()
);
create index aunora_feedback_user_created_idx on public.aunora_feedback(user_id,created_at desc);
create index aunora_feedback_status_created_idx on public.aunora_feedback(status,created_at desc);
alter table public.aunora_feedback enable row level security;
create policy "Aunora feedback read" on public.aunora_feedback for select to authenticated using ((select auth.uid())=user_id or (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy "Aunora feedback insert own" on public.aunora_feedback for insert to authenticated with check ((select auth.uid())=user_id and status='new' and reply='');
create policy "Aunora admins handle feedback" on public.aunora_feedback for update to authenticated using ((select auth.jwt()->'app_metadata'->>'role')='admin') with check ((select auth.jwt()->'app_metadata'->>'role')='admin');
grant select on public.aunora_feedback to authenticated;
grant insert(user_id,category,title,message,page_path) on public.aunora_feedback to authenticated;
grant update(status,reply) on public.aunora_feedback to authenticated;

create table public.aunora_announcements (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 3 and 120),
 body text not null check(length(body) between 3 and 500), path text not null default '/courses' check(path in ('/courses','/learn','/learn/library')),
 created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
 push_status text not null default 'pending' check(push_status in ('pending','sent','partial','not_configured','disabled')),
 sent_count integer not null default 0, failed_count integer not null default 0
);
create index aunora_announcements_created_idx on public.aunora_announcements(created_at desc);
alter table public.aunora_announcements enable row level security;
create policy "Aunora announcements read" on public.aunora_announcements for select to authenticated using (true);
create policy "Aunora announcements admin insert" on public.aunora_announcements for insert to authenticated with check ((select auth.jwt()->'app_metadata'->>'role')='admin' and created_by=(select auth.uid()));
create policy "Aunora announcements admin update" on public.aunora_announcements for update to authenticated using ((select auth.jwt()->'app_metadata'->>'role')='admin') with check ((select auth.jwt()->'app_metadata'->>'role')='admin');
grant select,insert,update on public.aunora_announcements to authenticated;

create table public.aunora_push_subscriptions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique check(length(endpoint) between 20 and 2048),
 p256dh text not null check(length(p256dh) between 80 and 100), auth text not null check(length(auth) between 20 and 30),
 created_at timestamptz not null default now()
);
create index aunora_push_subscriptions_user_idx on public.aunora_push_subscriptions(user_id);
alter table public.aunora_push_subscriptions enable row level security;
create policy "Aunora push read" on public.aunora_push_subscriptions for select to authenticated using ((select auth.uid())=user_id or (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy "Aunora push insert" on public.aunora_push_subscriptions for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Aunora push update" on public.aunora_push_subscriptions for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Aunora push delete" on public.aunora_push_subscriptions for delete to authenticated using ((select auth.uid())=user_id or (select auth.jwt()->'app_metadata'->>'role')='admin');
grant select,delete on public.aunora_push_subscriptions to authenticated;
grant insert(user_id,endpoint,p256dh,auth),update(p256dh,auth) on public.aunora_push_subscriptions to authenticated;

create table public.aunora_performance_alerts (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 page_path text not null check(length(page_path)<=200 and page_path like '/learn%'),
 metric text not null check(metric in ('LCP','INP','CLS','TTFB','FCP')), value double precision not null check(value>=0 and value<=600000),
 report_day date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),created_at timestamptz not null default now(),
 unique(user_id,page_path,metric,report_day)
);
create index aunora_performance_alerts_created_idx on public.aunora_performance_alerts(created_at desc);
alter table public.aunora_performance_alerts enable row level security;
create policy "Aunora performance read" on public.aunora_performance_alerts for select to authenticated using ((select auth.uid())=user_id or (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy "Aunora performance insert own" on public.aunora_performance_alerts for insert to authenticated with check ((select auth.uid())=user_id);
grant select on public.aunora_performance_alerts to authenticated;
grant insert(user_id,page_path,metric,value) on public.aunora_performance_alerts to authenticated;

create or replace function public.aunora_limit_daily_reports() returns trigger language plpgsql security invoker set search_path=public as $$
declare n integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.user_id::text||tg_table_name,0));
 if tg_table_name='aunora_feedback' then
  select count(*) into n from public.aunora_feedback where user_id=new.user_id and created_at>=(date_trunc('day',now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh');
  if n>=5 then raise exception 'Bạn đã gửi đủ 5 góp ý hôm nay.' using errcode='P0001'; end if;
 elsif tg_table_name='aunora_performance_alerts' then
  select count(*) into n from public.aunora_performance_alerts where user_id=new.user_id and created_at>=(date_trunc('day',now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh');
  if n>=20 then raise exception 'Daily performance report limit.' using errcode='P0001'; end if;
 elsif tg_table_name='aunora_push_subscriptions' then
  select count(*) into n from public.aunora_push_subscriptions where user_id=new.user_id;
  if n>=5 then raise exception 'Tối đa 5 thiết bị nhận thông báo.' using errcode='P0001'; end if;
 end if;
 return new;
end $$;
revoke all on function public.aunora_limit_daily_reports() from public;
create trigger aunora_feedback_limit before insert on public.aunora_feedback for each row execute function public.aunora_limit_daily_reports();
create trigger aunora_performance_limit before insert on public.aunora_performance_alerts for each row execute function public.aunora_limit_daily_reports();
create trigger aunora_push_limit before insert on public.aunora_push_subscriptions for each row execute function public.aunora_limit_daily_reports();

create or replace function public.aunora_admin_learning_summary() returns jsonb language plpgsql stable security invoker set search_path=public as $$
declare result jsonb; today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
 if coalesce((select auth.jwt()->'app_metadata'->>'role'),'')<>'admin' then raise exception 'Admin required' using errcode='42501'; end if;
 select jsonb_build_object(
 'active_today',(select count(*) from (select user_id from public.aunora_learning_activity where (last_seen_at at time zone 'Asia/Ho_Chi_Minh')::date=today union select user_id from public.aunora_learning_days where study_date=today) active_users),
 'completions_today',(select count(*) from public.aunora_learning_days where study_date=today),
 'completed_total',(select count(*) from public.aunora_lesson_progress where completed),
 'average_score',(select coalesce(round(avg(100.0*score/nullif(total_questions,0)),1),0) from public.aunora_lesson_progress where completed),
 'trend',(select coalesce(jsonb_agg(to_jsonb(t) order by day),'[]') from (select d::date as day,count(l.lesson_id) as completions,count(distinct l.user_id) as learners from generate_series(today-13,today,'1 day'::interval) d left join public.aunora_learning_days l on l.study_date=d::date group by d) t),
 'courses',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select p.course_id,coalesce(max(c.title),p.course_id) as title,count(*) as completions,count(distinct p.user_id) as learners from public.aunora_learning_days p left join public.zenvora_courses c on c.slug=p.course_id group by p.course_id order by count(*) desc limit 10) t),
 'subscribers',(select count(*) from public.aunora_push_subscriptions),
 'open_feedback',(select count(*) from public.aunora_feedback where status<>'resolved'),
 'slow_reports',(select count(*) from public.aunora_performance_alerts where created_at>now()-interval '7 days')
 ) into result;
 return result;
end $$;
revoke all on function public.aunora_admin_learning_summary() from public;
grant execute on function public.aunora_admin_learning_summary() to authenticated;
commit;

