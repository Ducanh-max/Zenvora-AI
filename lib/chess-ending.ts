import type {Result} from "./chess-match";
import type {Side} from "./chess-engine";
import type {ChessCue} from "./chess-audio";
export type EndingPhase="idle"|"landing"|"burst"|"done";
export const FINAL_MOVE_SETTLE_MS=240;
export const KING_BURST_MS=850;
/** Finish the visible move before the king effect and result sound. */
export function scheduleChessEnding(result:Result,player:Side|undefined,onPhase:(phase:EndingPhase)=>void,onCue:(cue:ChessCue)=>void,timers={later:(fn:()=>void,ms:number)=>setTimeout(fn,ms),cancel:(id:ReturnType<typeof setTimeout>)=>clearTimeout(id)}){
 let active=true;
 onPhase("landing");
 const impact=timers.later(()=>{
  if(!active)return;
  onPhase("burst");
  onCue(!result.winner?"draw":!player||result.winner===player?"win":"loss");
 },FINAL_MOVE_SETTLE_MS);
 const complete=timers.later(()=>{if(active)onPhase("done");},FINAL_MOVE_SETTLE_MS+KING_BURST_MS);
 return()=>{active=false;timers.cancel(impact);timers.cancel(complete);};
}
