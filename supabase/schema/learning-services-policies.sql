-- Keep role checks in a single statement-level initplan.
alter policy "Aunora admins change flags" on public.aunora_feature_flags using ((select (auth.jwt()->'app_metadata'->>'role')='admin')) with check ((select (auth.jwt()->'app_metadata'->>'role')='admin'));
alter policy "Aunora study days read" on public.aunora_learning_days using ((select auth.uid())=user_id or (select (auth.jwt()->'app_metadata'->>'role')='admin'));
alter policy "Aunora admins read lesson progress" on public.aunora_lesson_progress using ((select (auth.jwt()->'app_metadata'->>'role')='admin'));
alter policy "Aunora activity read" on public.aunora_learning_activity using ((select auth.uid())=user_id or (select (auth.jwt()->'app_metadata'->>'role')='admin'));
alter policy "Aunora feedback read" on public.aunora_feedback using ((select auth.uid())=user_id or (select (auth.jwt()->'app_metadata'->>'role')='admin'));
alter policy "Aunora admins handle feedback" on public.aunora_feedback using ((select (auth.jwt()->'app_metadata'->>'role')='admin')) with check ((select (auth.jwt()->'app_metadata'->>'role')='admin'));
alter policy "Aunora announcements admin insert" on public.aunora_announcements with check ((select (auth.jwt()->'app_metadata'->>'role')='admin') and created_by=(select auth.uid()));
alter policy "Aunora announcements admin update" on public.aunora_announcements using ((select (auth.jwt()->'app_metadata'->>'role')='admin')) with check ((select (auth.jwt()->'app_metadata'->>'role')='admin'));
alter policy "Aunora push read" on public.aunora_push_subscriptions using ((select auth.uid())=user_id or (select (auth.jwt()->'app_metadata'->>'role')='admin'));
alter policy "Aunora push delete" on public.aunora_push_subscriptions using ((select auth.uid())=user_id or (select (auth.jwt()->'app_metadata'->>'role')='admin'));
alter policy "Aunora performance read" on public.aunora_performance_alerts using ((select auth.uid())=user_id or (select (auth.jwt()->'app_metadata'->>'role')='admin'));
alter policy "Aunora admin deliveries" on public.aunora_notification_deliveries using ((select (auth.jwt()->'app_metadata'->>'role')='admin')) with check ((select (auth.jwt()->'app_metadata'->>'role')='admin'));
create index if not exists aunora_announcements_created_by_idx on public.aunora_announcements(created_by);
