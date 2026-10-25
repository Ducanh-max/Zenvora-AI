import {attacked,other,type Side} from "./chess-engine";
import type {Match} from "./chess-match";
export type ChessCue="move"|"capture"|"check"|"win"|"loss"|"draw";
export function chessCue(before:Match,after:Match,player?:Side):ChessCue|null{
 if(after.result&&!before.result)return !after.result.winner?"draw":!player||after.result.winner===player?"win":"loss";
 if(after.position.history.length<=before.position.history.length)return null;
 const p=after.position,king=p.board.indexOf(p.turn==="w"?"K":"k");if(king>=0&&attacked(p,king,other(p.turn)))return "check";
 return p.board.filter(x=>x!==".").length<before.position.board.filter(x=>x!==".").length?"capture":"move";
}
const notes:Record<ChessCue,number[]>={move:[440],capture:[240,180],check:[740,980],win:[523,659,784,1047],loss:[440,349,262],draw:[440,523,440]};
/** A single context is unlocked by a user gesture and reused for both players. */
export function createChessAudio(){
 let context:AudioContext|null=null,disposed=false;
 const active=new Set<OscillatorNode>();
 function unlock(){
  if(disposed||typeof window==="undefined")return;
  try{const Audio=window.AudioContext||(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!Audio)return;context??=new Audio();if(context.state==="suspended")void context.resume().catch(()=>{});}catch{/* Audio is optional. */}
 }
 function play(cue:ChessCue){
  const ctx=context;if(disposed||!ctx||ctx.state!=="running")return;
  try{const start=ctx.currentTime;notes[cue].forEach((frequency,i)=>{const oscillator=ctx.createOscillator(),gain=ctx.createGain(),at=start+i*.11,duration=cue==="move"?.1:.18;oscillator.type=cue==="capture"?"triangle":"sine";oscillator.frequency.setValueAtTime(frequency,at);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.08,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);oscillator.connect(gain);gain.connect(ctx.destination);active.add(oscillator);oscillator.onended=()=>{active.delete(oscillator);oscillator.disconnect();gain.disconnect();};oscillator.start(at);oscillator.stop(at+duration+.01);});}catch{/* Playback must never interrupt a move. */}
 }
 function dispose(){disposed=true;for(const oscillator of active){try{oscillator.stop();}catch{}}active.clear();if(context)void context.close().catch(()=>{});context=null;}
 return {unlock,play,dispose};
}
