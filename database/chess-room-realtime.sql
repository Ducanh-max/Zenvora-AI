-- RLS continues to restrict events to the host and guest of each room.
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='aunora_chess_rooms') then
  alter publication supabase_realtime add table public.aunora_chess_rooms;
 end if;
end $$;
