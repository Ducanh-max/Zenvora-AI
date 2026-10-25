begin;
create table public.aunora_notification_deliveries (
 announcement_id uuid not null references public.aunora_announcements(id) on delete cascade,
 subscription_id uuid not null references public.aunora_push_subscriptions(id) on delete cascade,
 status text not null check(status in ('sending','sent','failed')), attempts integer not null default 1 check(attempts between 1 and 3),
 updated_at timestamptz not null default now(), primary key(announcement_id,subscription_id)
);
create index aunora_notification_deliveries_subscription_idx on public.aunora_notification_deliveries(subscription_id);
alter table public.aunora_notification_deliveries enable row level security;
create policy "Aunora admin deliveries" on public.aunora_notification_deliveries for all to authenticated using ((select auth.jwt()->'app_metadata'->>'role')='admin') with check ((select auth.jwt()->'app_metadata'->>'role')='admin');
grant select,insert,update on public.aunora_notification_deliveries to authenticated;
create or replace function public.aunora_claim_push(p_announcement uuid) returns table(subscription_id uuid,endpoint text,p256dh text,auth text) language plpgsql security invoker set search_path=public as $$
begin
 if coalesce((select auth.jwt()->'app_metadata'->>'role'),'')<>'admin' then raise exception 'Admin required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_announcement::text,0));
 return query with claimed as (
 insert into public.aunora_notification_deliveries as d(announcement_id,subscription_id,status)
 select p_announcement,s.id,'sending' from public.aunora_push_subscriptions s
 left join public.aunora_notification_deliveries x on x.subscription_id=s.id and x.announcement_id=p_announcement
 where x.subscription_id is null or (x.status<>'sent' and x.attempts<3 and (x.status='failed' or x.updated_at<now()-interval '5 minutes'))
 order by s.id limit 25
 on conflict on constraint aunora_notification_deliveries_pkey do update set status='sending',attempts=d.attempts+1,updated_at=now()
 where d.status<>'sent' and d.attempts<3 and (d.status='failed' or d.updated_at<now()-interval '5 minutes')
 returning d.subscription_id)
 select s.id,s.endpoint,s.p256dh,s.auth from public.aunora_push_subscriptions s join claimed c on c.subscription_id=s.id;
end $$;
revoke all on function public.aunora_claim_push(uuid) from public;
grant execute on function public.aunora_claim_push(uuid) to authenticated;
commit;
