-- Keep end-of-move draw finalization in the same transaction as the move.
create or replace function public.aunora_chess_room_move(p_code text,p_actor uuid,p_position jsonb,p_version integer,p_winner uuid default null,p_finished_draw boolean default false)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare r jsonb;
begin
 if p_finished_draw and p_winner is not null then raise exception 'Kết quả không hợp lệ'; end if;
 r=public.aunora_chess_action(p_action=>'move',p_code=>p_code,p_actor=>p_actor,p_position=>p_position,p_version=>p_version,p_winner=>p_winner,p_time_control=>0);
 if p_finished_draw then
  update public.aunora_chess_rooms set status='finished',winner_id=null where code=p_code and version=(r->>'version')::integer and status='playing';
  select to_jsonb(x) into r from public.aunora_chess_rooms x where code=p_code;
 end if;
 return r;
end $$;
revoke all on function public.aunora_chess_room_move(text,uuid,jsonb,integer,uuid,boolean) from public,anon,authenticated;
grant execute on function public.aunora_chess_room_move(text,uuid,jsonb,integer,uuid,boolean) to service_role;
