/* Zenvora: a continuous, articulated garden story. All scene geometry is seeded
   once; time changes poses, path reveal and light, never the underlying drawing. */
(()=>{
'use strict';
const canvas=document.querySelector('#nightGarden');
const ctx=canvas.getContext('2d',{alpha:false});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const duration=15;
const introOnce=new URLSearchParams(window.location.search).get('intro')==='once' && window.parent!==window;
const completionTime=13.8;
let completed=false,waitingForStart=introOnce;
let time=reduced?12:0,paused=reduced,last=null,width=0,height=0,W=900,H=1600,portrait=true;
let pageVisible=!document.hidden;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=(a,b,t)=>{const n=clamp((t-a)/(b-a));return n*n*n*(n*(n*6-15)+10)};
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
function path(points,color,width=1,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore()}
const pt=(x,y)=>({x,y});
function bezier(a,b,c,d,n){const r=1-n;return pt(r*r*r*a.x+3*r*r*n*b.x+3*r*n*n*c.x+n*n*n*d.x,r*r*r*a.y+3*r*r*n*b.y+3*r*n*n*c.y+n*n*n*d.y)}
function circle(x,y,r,color,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore()}
const stars=(()=>{const r=rng(193);return Array.from({length:150},()=>({x:r(),y:r()*.65,r:.3+r()*.7,a:.12+r()*.3,phase:r()*6.28}))})();
const rain=(()=>{const r=rng(178);return Array.from({length:140},()=>({x:r(),y:r(),speed:.7+r()*.7,length:16+r()*24,alpha:.12+r()*.2}))})();
const soil=(()=>{const r=rng(66);return Array.from({length:36},()=>({vx:-20-r()*120,vy:-25-r()*70,delay:r()*.45,size:1+r()*3}))})();
const leaves=(()=>{const r=rng(89);return Array.from({length:18},()=>({x:(r()-.5)*120,y:-250-r()*90,delay:r()*.85,vx:-25-r()*90,vy:-10-r()*15,spin:r()*8,scale:2+r()*3}))})();
function makeRoots(seed){
 const r=rng(seed),segments=[];
 function branch(start,angle,length,depth,birth,rank){
  if(depth<0)return;
  const end=pt(start.x+Math.cos(angle)*length,start.y+Math.max(.06,Math.sin(angle))*length);
  const p1=pt(start.x+Math.cos(angle-.14)*length*.34,start.y+Math.max(.06,Math.sin(angle-.14))*length*.34);
  const p2=pt(end.x-Math.cos(angle+.18)*length*.34,end.y-Math.max(.06,Math.sin(angle+.18))*length*.34);
  const points=Array.from({length:15},(_,i)=>bezier(start,p1,p2,end,i/14));
  const span=.08+length*.3;
  segments.push({points,birth,span,rank,tip:depth===0,phase:r()*6.28});
  if(depth){const stem=angle+(r()-.5)*.45;
   branch(end,clamp(stem,.08,Math.PI-.08),length*(.56+r()*.17),depth-1,birth+span*.75,rank+1);
   if(r()>.13)branch(points[11],clamp(angle+(r()>.5?1:-1)*(.27+r()*.35),.08,Math.PI-.08),length*(.38+r()*.25),depth-1,birth+span*.62,rank+1);
  }
 }
 for(let i=0;i<9;i++){const a=.12+i*(Math.PI-.24)/8;branch(pt(0,0),a,.32+r()*.16,5,i*.008,0)}
 let maxX=0,maxY=0;for(const s of segments)for(const p of s.points){maxX=Math.max(maxX,Math.abs(p.x));maxY=Math.max(maxY,p.y)}
 for(const s of segments)for(const p of s.points){p.x/=maxX;p.y/=maxY}
 return segments;
}
const rootLeft=makeRoots(82),rootRight=makeRoots(249);
function drawRoots(segments,x,y,spread,depth,growth,gold,rotation=0,t=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.beginPath();ctx.rect(-W,-H,W*3,H*3);ctx.clip();
 if(gold>.02){ctx.shadowColor=`rgba(222,185,92,${gold*.45})`;ctx.shadowBlur=4}
 for(const s of segments){
  const g=clamp((growth-s.birth)/s.span);if(g<=0)continue;
  const count=(s.points.length-1)*g,end=Math.floor(count),points=s.points.slice(0,end+1);
  if(end<s.points.length-1)points.push(pt(lerp(s.points[end].x,s.points[end+1].x,count-end),lerp(s.points[end].y,s.points[end+1].y,count-end)));
  const r=Math.round(lerp(130,219,gold)),gcol=Math.round(lerp(124,193,gold)),b=Math.round(lerp(91,124,gold));
  path(points.map(p=>pt(p.x*spread,p.y*depth)),`rgb(${r},${gcol},${b})`,Math.max(.48,2.6-s.rank*.38),(.48+gold*.32)*(1-s.rank*.06));
  if(s.tip&&gold>.5&&s.phase>5.85){const endp=points[points.length-1];circle(endp.x*spread,endp.y*depth,1.15,'#f3dda0',gold*(.35+.35*Math.sin(t*1.5+s.phase)**2))}
 }
 ctx.restore();
}
// Continuous organic silhouettes, rather than circles piled on a trunk.
function blob(cx,cy,rx,ry,seed){
 const r=rng(seed),p=[];for(let i=0;i<18;i++){const a=i/18*Math.PI*2,f=.88+r()*.2;p.push(pt(cx+Math.cos(a)*rx*f,cy+Math.sin(a)*ry*f))}
 const result=new Path2D();let mid=pt((p[17].x+p[0].x)/2,(p[17].y+p[0].y)/2);result.moveTo(mid.x,mid.y);
 for(let i=0;i<18;i++){const next=p[(i+1)%18];result.quadraticCurveTo(p[i].x,p[i].y,(p[i].x+next.x)/2,(p[i].y+next.y)/2)}result.closePath();return result;
}
const canopyShape=blob(0,-.76,.30,.23,26);
const canopyPatches=[[-.13,-.81,.15,.14,14],[-.02,-.9,.13,.12,16],[.12,-.81,.14,.15,20],[.01,-.72,.17,.16,25],[-.15,-.7,.13,.12,37]];
const canopyDetails=(()=>{const r=rng(45);return Array.from({length:65},()=>{const a=r()*Math.PI*2,rad=Math.sqrt(r());return{x:Math.cos(a)*rad*.25,y:-.76+Math.sin(a)*rad*.18,a:r()*3,light:r()}})})();
function tree(x,y,size,rotation,wind,t,variant=0,growth=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(size,size);
 // Curved, tapering trunk and connected branch junctions.
 const bend=wind*.022;
 ctx.fillStyle=variant?'#735a35':'#685034';ctx.beginPath();ctx.moveTo(-.024,0);ctx.bezierCurveTo(-.008,-.23,-.024,-.45,bend-.011,-.77);ctx.lineTo(bend+.012,-.77);ctx.bezierCurveTo(.019,-.42,.018,-.18,.024,0);ctx.closePath();ctx.fill();
 path([pt(.004,-.28),pt(.12+bend,-.4),pt(.19+bend,-.53)],'#725a36',.013);
 path([pt(-.002,-.39),pt(-.115+bend,-.51),pt(-.15+bend,-.62)],'#80683f',.010);
 path([pt(.006,-.48),pt(.10+bend,-.62)],'#846c41',.008);
 path([pt(-.011,-.02),pt(-.005,-.2),pt(-.008,-.38)],'#b2955b',.003,.28);
 ctx.save();ctx.translate(bend,0);ctx.rotate(wind*.006);
 const grad=ctx.createLinearGradient(-.25,-1,.23,-.51);grad.addColorStop(0,variant?'#48744b':'#2b654e');grad.addColorStop(.52,variant?'#335c3e':'#1d513e');grad.addColorStop(1,variant?'#213e2e':'#12392e');ctx.fillStyle=grad;ctx.fill(canopyShape);ctx.clip(canopyShape);
 for(let i=0;i<canopyPatches.length;i++){const [cx,cy,rx,ry,se]=canopyPatches[i];ctx.fillStyle=variant?['#608557','#648c5b','#467249','#416c43','#52794b'][i]:['#397459','#3e775b','#28634b','#255c44','#326b50'][i];ctx.globalAlpha=.55;ctx.fill(blob(cx,cy,rx,ry,se))}
 ctx.globalAlpha=1;
 for(const p of canopyDetails){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.strokeStyle=p.light>.55?'#b2c591':'#173e2c';ctx.globalAlpha=p.light>.55?.09:.19;ctx.lineWidth=.003;ctx.beginPath();ctx.moveTo(-.006,0);ctx.quadraticCurveTo(0,-.007,.009,-.001);ctx.stroke();ctx.restore()}
 if(variant){for(let i=0;i<7;i++){const p=canopyDetails[i*7];circle(p.x,p.y,.0027,'#dfd494',growth*(.3+.45*Math.sin(t*1.5+i)**2))}}
 ctx.restore();ctx.restore();
}
function ik(a,b,length1,length2,flip){
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(.001,Math.hypot(dx,dy)),reach=Math.min(d,length1+length2-.001),along=(length1*length1-length2*length2+reach*reach)/(2*reach),side=Math.sqrt(Math.max(0,length1*length1-along*along));
 const ux=dx/d,uy=dy/d;return pt(a.x+ux*along-uy*side*flip,a.y+uy*along+ux*side*flip)
}
function limb(a,joint,b,color,weight){path([a,joint,b],color,weight)}
function canShape(x,y,angle,scale=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
 const g=ctx.createLinearGradient(0,-10,0,15);g.addColorStop(0,'#dac16a');g.addColorStop(1,'#a38a3c');ctx.fillStyle=g;
 ctx.beginPath();ctx.moveTo(-17,-11);ctx.lineTo(15,-11);ctx.lineTo(17,12);ctx.quadraticCurveTo(0,18,-17,12);ctx.closePath();ctx.fill();
 path([pt(14,4),pt(30,-3),pt(39,-17)],'#c9af56',6);
 path([pt(-15,-6),pt(-27,-7),pt(-28,6),pt(-16,8)],'#b7a057',4);
 ctx.fillStyle='#ddc675';ctx.beginPath();ctx.ellipse(39,-17,6,2.4,-.5,0,Math.PI*2);ctx.fill();ctx.restore()
}
function pose(x,y,size,t,graduate,can){
 const watering=1-ease(2.65,3.25,t),crouch=graduate?0:ease(2.8,3.45,t)*(1-ease(3.6,4.25,t));
 const walking=graduate?.22*ease(4,4.25,t)*(1-ease(4.6,5.1,t)):ease(3.7,4.05,t)*(1-ease(4.65,5.25,t));
 const recoil=ease(4.0,4.45,t)*(1-ease(5.25,6.4,t));
 const breathe=Math.sin(t*2.1+(graduate?0:1.4))*.9;
 const s=size/180;
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 const walkPhase=(t-3.8)*10,step=walking*24,bob=Math.abs(Math.sin(walkPhase))*walking*2;
 const hip=pt((graduate?-5:-12)*recoil,-65+crouch*28+bob),shoulder=pt((graduate?-12:-20)*recoil+(graduate?0:25)*watering+(graduate?0:35)*crouch,-132+crouch*66+breathe+bob);
 const footA=pt(-13+Math.sin(walkPhase)*step,-Math.max(0,Math.cos(walkPhase))*walking*10),footB=pt(13-Math.sin(walkPhase)*step,-Math.max(0,-Math.cos(walkPhase))*walking*10);
 // Back limbs are muted; contact feet remain exactly on the ground.
 limb(hip,ik(hip,footB,35,32,-1),footB,'#b8b9a2',6.2);
 limb(hip,ik(hip,footA,35,32,1),footA,'#e0dfc2',6.7);
 path([hip,pt(lerp(hip.x,shoulder.x,.48)-2,lerp(hip.y,shoulder.y,.48)),shoulder],'#e2e1c6',7.3);
 const head=pt(shoulder.x+3*watering-4*recoil,shoulder.y-25);
 circle(head.x,head.y,13,'#dedfc2');circle(head.x+4,head.y-3,9,'#ebe7cb',.45);
 let handA,handB;
 const reach=graduate?0:recoil;
 handA=pt(shoulder.x-lerp(12,27,reach),shoulder.y+lerp(73,50,reach));
 handB=pt(shoulder.x+lerp(11,40,reach),shoulder.y+lerp(70,38,reach));
 if(graduate){handA=pt(-6-recoil*17,-79-recoil*21);handB=pt(13+recoil*20,-79-recoil*16);const neutral=ease(5.5,6.5,t);handA=pt(lerp(handA.x,shoulder.x-9,neutral),lerp(handA.y,shoulder.y+70,neutral));handB=pt(lerp(handB.x,shoulder.x+12,neutral),lerp(handB.y,shoulder.y+70,neutral))}
 else{const release=ease(3.55,4.15,t),holdA=pt((can.x-x)/s-22,(can.y-y)/s-2),holdB=pt((can.x-x)/s-8,(can.y-y)/s+8);handA=pt(lerp(holdA.x,handA.x,release),lerp(holdA.y,handA.y,release));handB=pt(lerp(holdB.x,handB.x,release),lerp(holdB.y,handB.y,release))}
 limb(pt(shoulder.x-2,shoulder.y+3),ik(shoulder,handA,39,36,1),handA,'#c6cab0',5.7);
 limb(pt(shoulder.x+2,shoulder.y+4),ik(shoulder,handB,39,36,-1),handB,'#e8e4c8',6);
 if(graduate){ctx.fillStyle='#d2b650';ctx.beginPath();ctx.moveTo(head.x-22,head.y-14);ctx.lineTo(head.x+1,head.y-22);ctx.lineTo(head.x+25,head.y-14);ctx.lineTo(head.x+1,head.y-7);ctx.closePath();ctx.fill();path([pt(head.x+21,head.y-13),pt(head.x+22,head.y+2+Math.sin(t*2)*1.5)],'#c5aa4d',1.5)}
 ctx.restore();
}
function drawText(s,x,y,size,color,alpha=1,italic=false,tracking=0){
 if(alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;ctx.font=`${italic?'italic ':''}${size}px Georgia, serif`;ctx.fillStyle=color;ctx.textBaseline='middle';
 if(!tracking){ctx.textAlign='center';ctx.fillText(s,x,y)}else{const letters=[...s],tw=letters.reduce((v,c)=>v+ctx.measureText(c).width,0)+tracking*(letters.length-1);let xx=x-tw/2;for(const c of letters){ctx.fillText(c,xx,y);xx+=ctx.measureText(c).width+tracking}}ctx.restore()
}
function draw(t){
 if(!width)return;
 const ground=portrait?1040:610,left=portrait?240:445,right=portrait?690:1180;
 const treeH=portrait?520:405,personH=portrait?190:159;
 const storm=ease(2.6,3.8,t)*(1-ease(5.6,7.4,t));
 const restAngle=portrait?1.535:1.18;
 const fallP=clamp((t-3.95)/1.3);let fall=restAngle*Math.pow(fallP,2.35);
 if(t>5.25){const dt=t-5.25;fall=restAngle-Math.sin(dt*18)*Math.exp(-dt*5.5)*.055}
 const anticipation=Math.sin(t*7)*ease(2.8,3.9,t)*(1-ease(3.9,4.4,t))*.035;
 const wind=Math.sin(t*3.8)*storm+.15*Math.sin(t*1.15);
 const growth=ease(1,10.8,t),rootGrowth=.35+.7*ease(.2,10.4,t),gold=ease(6.3,9.8,t),final=ease(8.3,9.7,t);
 const fade=ease(0,.55,t)*(1-ease(14.35,15,t));
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.globalAlpha=1;ctx.fillStyle='#040607';ctx.fillRect(0,0,W,H);ctx.save();ctx.globalAlpha=1;
 const sky=ctx.createLinearGradient(0,0,0,ground);sky.addColorStop(0,'#030608');sky.addColorStop(.6,'#080d16');sky.addColorStop(1,'#101322');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 for(const s of stars)circle(s.x*W,s.y*H,s.r,'#b8c4b4',s.a*(.8+.2*Math.sin(t*.7+s.phase))*(1-storm*.7));
 const moonX=W*.875,moonY=H*(portrait?.265:.26),moonR=portrait?30:24;
 ctx.save();ctx.globalAlpha*=1-storm*.55;const glow=ctx.createRadialGradient(moonX,moonY,moonR*.4,moonX,moonY,moonR*4);glow.addColorStop(0,'#d7ce9a1b');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(moonX-moonR*4,moonY-moonR*4,moonR*8,moonR*8);
 // A crescent path leaves no opaque black disk over the sky.
 ctx.fillStyle='#d9d2a7';ctx.beginPath();ctx.moveTo(moonX+moonR*.33,moonY-moonR*.945);ctx.bezierCurveTo(moonX-moonR*1.35,moonY-moonR*.8,moonX-moonR*1.35,moonY+moonR*.8,moonX+moonR*.33,moonY+moonR*.945);ctx.bezierCurveTo(moonX-moonR*.63,moonY+moonR*.48,moonX-moonR*.63,moonY-moonR*.48,moonX+moonR*.33,moonY-moonR*.945);ctx.fill();ctx.restore();
 const earth=ctx.createLinearGradient(0,ground,0,H);earth.addColorStop(0,'#15120c');earth.addColorStop(1,'#090a08');ctx.fillStyle=earth;ctx.fillRect(0,ground,W,H-ground);
 path([pt(0,ground+.5),pt(W,ground+.5)],'#7f6c3b',1.8,.6);
 const leftAngle=-fall+anticipation;const lift=ease(4.1,5.25,t)*11;
 drawRoots(rootLeft,left,ground-lift,portrait?210:150,portrait?130:96,.98,0,leftAngle,t);
 if(gold>.01){const gl=ctx.createRadialGradient(right,ground+160,10,right,ground+160,portrait?330:260);gl.addColorStop(0,`rgba(181,144,63,${gold*.085})`);gl.addColorStop(1,'transparent');ctx.fillStyle=gl;ctx.fillRect(0,ground,W,H-ground)}
 drawRoots(rootRight,right,ground,portrait?365:350,portrait?440:240,rootGrowth,gold,0,t);
 tree(left,ground-lift,treeH,leftAngle,wind,t);
 const rightH=portrait?lerp(112,385,growth):lerp(105,330,growth);
 tree(right,ground,rightH,Math.sin(t*2.2)*.007+wind*.008,wind*.4,t,1,growth);
 // Watering can and body share the same continuous motion through placement.
 const gardenerStart=portrait?540:965,walk=ease(3.85,5.3,t),gardenerX=gardenerStart-(portrait?92:95)*walk;
 const lower=ease(2.75,3.55,t),canX=gardenerStart+lerp(66,100,lower),canY=ground+lerp(-personH*.55,-14,lower),canAngle=lerp(-.22,.04,lower)+Math.sin(t*2.3)*.014*(1-lower);
 const can={x:canX,y:canY};
 pose((portrait?368:660)-(portrait?14:20)*ease(4.0,4.8,t),ground,personH,t,true,can);
 pose(gardenerX,ground,personH,t,false,can);
 canShape(canX,canY,canAngle,portrait?.94:.82);
 const pour=1-ease(2.6,3.2,t);
 for(let i=0;i<27;i++){const flight=.45,k=(t*2.1+i/27)%1,age=k*flight,emit=t-age;if(emit<0||emit>3.08)continue;
  const strength=1-ease(2.6,3.08,emit),ex=gardenerStart+66+37,ey=ground-personH*.55-23;
  const dx=50*age,dy=18*age+330*age*age;circle(ex+dx,ey+dy,portrait?1.25:1,'#d5d3a3',strength*(1-k)*.8);
 }
 // Leaves and soil continue moving after impact rather than disappearing.
 if(t>3.9){for(const p of leaves){let a=t-4-p.delay;if(a<0||a>2.1)continue;const tt=Math.min(1,(a+.1)/1.3),ang=-1.535*Math.pow(tt,2.35);const x=left+p.x*Math.cos(ang)-p.y*Math.sin(ang)+p.vx*a,y=ground+p.x*Math.sin(ang)+p.y*Math.cos(ang)+p.vy*a+85*a*a;
 if(y>ground-1)continue;ctx.save();ctx.translate(x,y);ctx.rotate(a*p.spin);ctx.globalAlpha*=1-ease(1.3,2.1,a);ctx.fillStyle='#587849';ctx.beginPath();ctx.ellipse(0,0,p.scale,p.scale*.4,0,0,Math.PI*2);ctx.fill();ctx.restore()}}
 if(t>4.5){for(const p of soil){const a=t-4.7-p.delay;if(a<0||a>1.25)continue;const x=left+p.vx*a,y=ground-9+p.vy*a+180*a*a;if(y>ground)continue;circle(x,y,p.size,'#8a7751',1-ease(.7,1.25,a))}}
 if(storm>.01){ctx.save();ctx.beginPath();ctx.rect(0,0,W,ground);ctx.clip();for(const r of rain){const x=((r.x*W-t*90*r.speed)%W+W)%W,y=((r.y*ground+t*420*r.speed)%ground+ground)%ground;path([pt(x,y),pt(x-8*storm,y+r.length)],'#9caeb8',.85,storm*r.alpha)}ctx.restore();
  for(let i=0;i<18;i++){const phase=(t*2.6+i*.17)%1;if(phase>.45)continue;const x=(i*179+43)%W;path([pt(x-5*phase,ground-3*phase),pt(x,ground-6*phase),pt(x+5*phase,ground)],'#a1a3a0',.7,storm*(.45-phase)*.3)}
 }
 const labelSize=portrait?28:26;
 drawText('IT CAREERS',W*.5,H*.105,portrait?19:16,'#a59b73',.85,false,portrait?6:5);
 drawText('A DEGREE',portrait?235:445,H*.153,labelSize,'#e5e2cf',.95,false,5);
 drawText('SKILLS',portrait?685:1180,H*.153,labelSize,'#e5e2cf',.95,false,5);
 path([pt((portrait?235:445)-27,H*.173),pt((portrait?235:445)+27,H*.173)],'#a99458',1.5,.7);path([pt((portrait?685:1180)-27,H*.173),pt((portrait?685:1180)+27,H*.173)],'#a99458',1.5,.7);
 const center=portrait?W*.5:W*.51;
 drawText('Titles fade.',center,H*(portrait?.255:.277),portrait?49:43,'#e4dfc7',final,true);
 drawText('Skills compound.',center,H*(portrait?.303:.341),portrait?49:43,'#d5c183',final,true);
 drawText('DEPTH OUTLASTS HEIGHT',center,H*(portrait?.36:.415),portrait?16:14,'#aaa78f',final,false,4.8);
 // Subtle annotations sit beside, rather than over, the brightest roots.
 if(final>.01){const words=['LISTENING','SPEAKING','VOCABULARY','CONFIDENCE'];for(let i=0;i<4;i++){const y=ground+(portrait?160:62)+i*(portrait?66:43),x=portrait?350:750;drawText(words[i],x,y,portrait?15:13,'#b8a471',final*.8,false,1.8);path([pt(x+(portrait?76:67),y),pt(right-(portrait?64:90)+i*9,y-9)],'#ad9553',.8,final*.45)}}
 ctx.restore();
 if(fade<1){ctx.fillStyle=`rgba(4,6,7,${1-fade})`;ctx.fillRect(0,0,W,H)}
}
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);width=r.width;height=r.height;portrait=width<height;W=portrait?900:1600;H=portrait?1600:900;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);draw(time)}
new ResizeObserver(resize).observe(canvas);
function completeIntro(){
 if(completed||!introOnce)return;
 completed=true;paused=true;time=completionTime;draw(time);
 window.parent.postMessage({type:'zenvora:garden-complete'},window.location.origin);
}
function tick(now){
 if(last!==null&&!paused&&pageVisible&&!waitingForStart){
  time+=Math.max(0,(now-last)/1000);
  if(introOnce&&time>=completionTime)completeIntro();
  else{time%=duration;draw(time)}
 }
 last=now;requestAnimationFrame(tick)
}
requestAnimationFrame(tick);
window.addEventListener('message',event=>{
 if(!introOnce||event.source!==window.parent||event.origin!==window.location.origin)return;
 if(event.data?.type==='zenvora:garden-start'&&waitingForStart){
  waitingForStart=false;last=null;
  if(reduced)completeIntro();
  else{time=0;paused=false;draw(time);}
 }
 if(event.data?.type==='zenvora:garden-pause'){paused=true;last=null;}
});
if(introOnce)window.parent.postMessage({type:'zenvora:garden-ready'},window.location.origin);
window.zenvoraScene={seek(seconds){time=clamp(Number(seconds)||0,0,duration-.001);paused=true;last=null;draw(time)},play(){paused=false;last=null;},get state(){return{time,paused,duration,portrait}}};
document.addEventListener('visibilitychange',()=>{pageVisible=!document.hidden;last=null});
})();
