import type {SupabaseClient} from "@supabase/supabase-js";
import type {Position} from "./chess-engine";
export type ChessRoom={code:string;host_id:string;guest_id:string|null;host_name:string;guest_name:string|null;status:"waiting"|"playing"|"finished"|"closed";position:Position;version:number;winner_id:string|null;time_control:number;white_ms:number|null;black_ms:number|null;turn_started_at:string|null};
/** Versions are monotonic; an old poll or HTTP reply must never undo a newer move. */
export function newerRoom(current:ChessRoom|null,incoming:ChessRoom):ChessRoom{
 if(!current)return incoming;
 if(current.code!==incoming.code||incoming.version<current.version)return current;
 if(incoming.version>current.version)return incoming;
 // The existing join RPC updates the guest without incrementing version.
 if(current.status==="waiting"&&incoming.status==="waiting"&&!current.guest_id&&incoming.guest_id)return incoming;
 return current;
}
export function watchChessRoom(db:SupabaseClient,code:string,receive:(room:ChessRoom)=>void){
 let active=true,connected=false,inFlight:Promise<void>|null=null,timer:ReturnType<typeof setTimeout>|undefined;
 const schedule=()=>{if(active){clearTimeout(timer);timer=setTimeout(()=>void refresh(),connected?8000:1200);}};
 function refresh():Promise<void>{
  if(!active)return Promise.resolve();if(inFlight)return inFlight;
  clearTimeout(timer);
  inFlight=(async()=>{try{const {data,error}=await db.from("aunora_chess_rooms").select("*").eq("code",code).maybeSingle();if(active&&!error&&data)receive(data as ChessRoom);}catch{/* Realtime or the next retry can recover the connection. */}finally{inFlight=null;schedule();}})();return inFlight;
 }
 const channel=db.channel("chess-room:"+code).on("postgres_changes",{event:"UPDATE",schema:"public",table:"aunora_chess_rooms",filter:"code=eq."+code},payload=>{if(active&&payload.new?.code===code)receive(payload.new as ChessRoom);}).subscribe(status=>{if(!active)return;connected=status==="SUBSCRIBED";if(connected)void refresh();else schedule();});
 void refresh();
 return {refresh,stop(){active=false;clearTimeout(timer);void db.removeChannel(channel).catch(()=>{});}};
}
