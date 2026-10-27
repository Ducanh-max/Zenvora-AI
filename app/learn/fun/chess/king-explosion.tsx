import type {CSSProperties} from "react";
const particles=Array.from({length:12},(_,i)=>{
 const angle=i*Math.PI/6,distance=i%2?78:58;
 return {"--burst-x":Math.round(Math.cos(angle)*distance)+"px","--burst-y":Math.round(Math.sin(angle)*distance)+"px","--burst-spin":(i%2?240:-240)+"deg"} as CSSProperties;
});
export default function KingExplosion(){
 return <span className="ch-king-burst" aria-hidden="true"><span className="ch-burst-flash"/>{particles.map((style,i)=><span key={i} className="ch-burst-shard" style={style}/>)}</span>;
}
