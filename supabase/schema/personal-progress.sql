begin;
create or replace function public.aunora_my_learning_summary() returns jsonb language plpgsql stable security invoker set search_path=public as $$
declare result jsonb; uid uuid := (select auth.uid()); today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
 if uid is null then raise exception 'Sign in required' using errcode='42501'; end if;
 select jsonb_build_object(
 'completed_total',(select count(*) from public.aunora_lesson_progress where user_id=uid and completed),
 'average_score',(select coalesce(round(avg(100.0*score/nullif(total_questions,0)),1),0) from public.aunora_lesson_progress where user_id=uid and completed),
 'study_days',(select count(distinct study_date) from public.aunora_learning_days where user_id=uid),
 'streak',(select count(*) from (select study_date,row_number()over(order by study_date desc) rn from (select distinct study_date from public.aunora_learning_days where user_id=uid) d) s where study_date=(select max(study_date) from public.aunora_learning_days where user_id=uid and study_date>=today-1)-(rn-1)::integer),
 'trend',(select coalesce(jsonb_agg(to_jsonb(t) order by day),'[]') from (select d::date as day,count(l.lesson_id) as completions from generate_series(today-13,today,'1 day'::interval) d left join public.aunora_learning_days l on l.study_date=d::date and l.user_id=uid group by d) t)
 ) into result;
 return result;
end $$;
revoke all on function public.aunora_my_learning_summary() from public;
grant execute on function public.aunora_my_learning_summary() to authenticated;
commit;
