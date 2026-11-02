/* Original AUNORA artwork. Parametric 3D petals, silk veins and a continuous
   growth cycle are drawn at the display's pixel density, without video assets. */
(()=>{
'use strict';
const canvas=document.querySelector('#flower'),ctx=canvas.getContext('2d',{alpha:false});
const TAU=Math.PI*2,PERIOD=20,W=900,H=1100;
let width=0,height=0,time=0,last=null,active=true,background=null;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,t)=>{let p=clamp((t-a)/(b-a));return p*p*p*(10+p*(-15+6*p))};
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
const rand=rng(13271);
const ground=Array.from({length:700},()=>{let a=rand()*TAU,r=Math.sqrt(rand());return{x:Math.cos(a)*r*340,z:Math.sin(a)*r*115,r:.3+rand()*1.1,light:rand(),phase:rand()*TAU}});
const motes=Array.from({length:38},()=>({x:(rand()-.5)*670,y:180+rand()*650,r:.5+rand()*1.0,phase:rand()*TAU}));
const petals=[];
for(let ring=0;ring<3;ring++){const count=[15,12,9][ring];for(let i=0;i<count;i++)petals.push({ring,angle:i/count*TAU+ring*.29,length:[255,215,167][ring]*(.94+rand()*.12),width:[57,49,39][ring],phase:rand()*TAU})}
const debris=Array.from({length:85},()=>({petal:Math.floor(rand()*petals.length),u:.2+rand()*.78,v:(rand()-.5)*1.6,delay:rand()*1.5,drift:(rand()-.5)*120,r:.55+rand()*1.1,phase:rand()*TAU}));
function project(p){const scale=1-p.z/2400;return{x:450+p.x*scale,y:915-p.y-p.z*.29,z:p.z}}
function line(points,color,weight=1,alpha=1){if(points.length<2||alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=weight;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();for(let i=0;i<points.length;i++)i?ctx.lineTo(points[i].x,points[i].y):ctx.moveTo(points[i].x,points[i].y);ctx.stroke();ctx.restore()}
function dot(x,y,r,color,alpha=1,target=ctx){if(alpha<=0)return;target.save();target.globalAlpha=alpha;target.fillStyle=color;target.beginPath();target.arc(x,y,r,0,TAU);target.fill();target.restore()}
function glow(x,y,r,color,alpha=1){if(alpha<=0)return;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(.25,color);g.addColorStop(1,'transparent');ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore()}
function center(s,state){return{x:state.lean*155*s*s+Math.sin(state.phase+s*3)*4*s,y:state.height*s,z:Math.sin(s*Math.PI)*5}}
const curves=new Map();
function curve(u){let c=curves.get(u);if(!c){const sin=Math.sin(Math.PI*u);c={sin,half:Math.sin(u*Math.PI*.5),width:Math.pow(Math.max(0,sin),.85),u2:u*u};curves.set(u,c)}return c}
function petalPoint(p,u,v,state){
 if(p.frameState!==state){const angle=p.angle+Math.sin(state.phase*.5+p.phase)*.025;p.frameState=state;p.basis={cos:Math.cos(angle),sin:Math.sin(angle),length:p.length*state.bud,wave:Math.sin(state.phase*1.5+p.phase),center:state.center||center(1,state)}}
 const basis=p.basis,c=curve(u),opening=state.open,length=basis.length;
 const radial=length*(opening*.98*c.half+(1-opening)*.12*c.sin);
 const breadth=p.width*c.width*(.12+.88*opening)*v*state.bud;
 const up=length*(u*(.8+.05*opening)-c.u2*.35*opening);
 const droop=state.wilt*length*(c.u2*.65+.08*c.sin);
 return{x:basis.center.x+radial*basis.cos-breadth*basis.sin+state.wilt*c.u2*30,y:basis.center.y+up-droop-v*v*c.sin*14+basis.wave*opening*c.u2*3,z:basis.center.z+radial*basis.sin+breadth*basis.cos};
}
function drawPetal(p,state){
 const opacity=state.visible*(.65+.35*state.bud)*(.2+.8*state.open);if(opacity<.002||state.bud<.002)return;
 const edge=[];for(let i=0;i<=32;i++)edge.push(project(petalPoint(p,i/32,-1,state)));for(let i=32;i>=0;i--)edge.push(project(petalPoint(p,i/32,1,state)));
 const base=project(petalPoint(p,0,0,state)),tip=project(petalPoint(p,1,0,state));
 const g=ctx.createLinearGradient(base.x,base.y,tip.x,tip.y);g.addColorStop(0,'rgba(245,255,218,.025)');g.addColorStop(.3,'rgba(255,178,218,.045)');g.addColorStop(1,'rgba(174,146,241,.065)');
 ctx.save();ctx.globalAlpha=opacity;ctx.fillStyle=g;ctx.beginPath();edge.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fill();ctx.restore();
 // Fine unblurred filaments hold definition even on high-density displays.
 for(let k=0;k<11;k++){const v=-1+k/5,points=[];for(let i=0;i<=26;i++)points.push(project(petalPoint(p,i/26,v,state)));
  const edgeVein=k===0||k===10;line(points,edgeVein?'#e9b5f2':'#d995d7',edgeVein?1.15:.64,opacity*(edgeVein?.5:.18));
 }
 for(let i=3;i<=8;i++){const u=i/10,points=[];for(let j=0;j<=8;j++)points.push(project(petalPoint(p,u,-1+j/4,state)));line(points,'#c98de3',.45,opacity*.14)}
 const ridge=[];for(let i=0;i<=30;i++)ridge.push(project(petalPoint(p,i/30,0,state)));line(ridge,'#ffd5ed',.9,opacity*.35);
 const tipGlow=.3+.7*Math.sin(state.phase+p.phase)**2;dot(tip.x,tip.y,.85,'#ffe5f8',opacity*tipGlow*.8);
}
function leafPoint(level,side,u,v,state){
 const c=center(level,state),growth=smooth(level*3.2+.4,level*3.2+1.9,state.t)*(1-state.wilt*.34),a=side>0?-.16:Math.PI+.16;
 const len=(105-level*30)*growth,r=u*len,breadth=Math.sin(Math.PI*u)*23*growth*v;
 return{x:c.x+Math.cos(a)*r-Math.sin(a)*breadth,y:c.y+Math.sin(Math.PI*u)*22*growth+u*14-state.wilt*u*u*35,z:c.z+Math.sin(a)*r+Math.cos(a)*breadth};
}
function drawLeaves(state){
 for(let i=0;i<6;i++){const level=.18+i*.115,side=i%2?1:-1,alpha=state.visible*smooth(i*.45+.8,i*.45+2,state.t);if(alpha<=.001)continue;
  for(let k=0;k<=8;k++){const points=[];for(let j=0;j<=25;j++)points.push(project(leafPoint(level,side,j/25,-1+k/4,state)));line(points,k===4?'#bcffe2':'#5edcb7',k===4?1.1:.65,alpha*(k===4?.75:.36))}
  for(let j=3;j<9;j++){const points=[];for(let k=0;k<=8;k++)points.push(project(leafPoint(level,side,j/10,-1+k/4,state)));line(points,'#71f1c1',.5,alpha*.28)}
 }
}
function drawStem(state){
 if(state.height<1)return;
 const points=Array.from({length:65},(_,i)=>project(center(i/64,state)));
 line(points,'#2ddeaa',9,state.visible*.055);line(points,'#52f2be',4,state.visible*.13);line(points,'#8bffd5',1.8,state.visible*.8);
 for(let j=0;j<2;j++){const veins=points.map((p,i)=>({x:p.x+(j?1:-1)*(1.5+Math.sin(i*.1)*.6),y:p.y}));line(veins,'#42cfa4',.55,state.visible*.55)}
 drawLeaves(state);
}
function drawCore(state){
 if(state.bud<.01)return;const c=center(1,state),b=project(c);
 glow(b.x,b.y,70*state.bud,'#f5a0dc',state.visible*.045);
 for(let i=0;i<28&&state.open>.1;i++){const a=i/28*TAU,rad=(15+(i%5)*2)*state.open*state.bud,len=(35+(i%7)*5)*state.bud,points=[];
  for(let j=0;j<=12;j++){const u=j/12;points.push(project({x:c.x+Math.cos(a)*rad*u,y:c.y+len*u-Math.sin(Math.PI*u)*4,z:c.z+Math.sin(a)*rad*u}))}
  line(points,'#ffe4c0',.6,state.visible*state.open*.35);const p=points[12];dot(p.x,p.y,.85,'#ffedc4',state.visible*state.open*.7);
 }
 glow(b.x,b.y,17*state.bud,'#f4e6b6',state.visible*.09);dot(b.x,b.y,2.5*state.bud,'#fff4dd',state.visible*.65);
}
function buildBackground(){
 background=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(canvas.width,canvas.height):document.createElement('canvas');background.width=canvas.width;background.height=canvas.height;
 const target=background.getContext('2d'),scale=Math.min(width/W,height/H);
 target.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);target.fillStyle='#061211';target.fillRect(0,0,width,height);target.translate((width-W*scale)/2,(height-H*scale)/2);target.scale(scale,scale);
 const bg=target.createRadialGradient(450,610,0,450,610,600);bg.addColorStop(0,'#10262a');bg.addColorStop(.65,'#081817');bg.addColorStop(1,'#061211');target.fillStyle=bg;target.fillRect(0,0,W,H);
 for(const p of ground){const q=project({x:p.x,y:-5,z:p.z});dot(q.x,q.y,p.r,'#91d9bd',(.05+p.light*.22)*.9,target)}
}
function draw(t){
 if(!width||!height)return;
 const phase=TAU*t/PERIOD,scale=Math.min(width/W,height/H);
 ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(background,0,0);ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);ctx.translate((width-W*scale)/2,(height-H*scale)/2);ctx.scale(scale,scale);
 for(const m of motes){dot(m.x+450+Math.sin(phase+m.phase)*9,m.y+Math.cos(phase+m.phase)*7,m.r,'#8ed4be',.08+.09*Math.sin(phase+m.phase)**2)}
 const growth=smooth(.6,5,t),wilt=smooth(14.4,17.6,t),visible=1-smooth(16.7,18.7,t);
 const state={t,phase,height:390*growth*(1-.18*wilt),lean:wilt*.7,open:smooth(5.5,10,t),bud:smooth(3.5,6.4,t),wilt,visible};state.center=center(1,state);
 drawStem(state);
 if(state.bud>.001){const head=project(center(1,state));glow(head.x,head.y-90,240,'#ac7ed5',state.open*state.visible*.025);ctx.save();ctx.globalCompositeOperation='screen';const ordered=petals.slice().sort((a,b)=>Math.sin(b.angle)-Math.sin(a.angle));for(const p of ordered)drawPetal(p,state);drawCore(state);ctx.restore()}
 // Detached flecks fall and fade into the same ground from which the next seed grows.
 if(t>15){ctx.save();ctx.globalCompositeOperation='lighter';for(const d of debris){const age=t-15.3-d.delay;if(age<0||age>3.6)continue;const birthState={...state,t:15.3+d.delay,visible:1,wilt:smooth(14.4,17.6,15.3+d.delay)};const q=petalPoint(petals[d.petal],d.u,d.v,birthState);q.x+=d.drift*age+Math.sin(age*3+d.phase)*12;q.y-=22*age+38*age*age;q.z+=Math.sin(age+d.phase)*28;const p=project(q);if(p.y>935)continue;const alpha=(1-smooth(1.8,3.6,age))*(1-smooth(18.5,19.6,t))*.55;dot(p.x,p.y,d.r,'#dec4e7',alpha)}ctx.restore()}
 const seedStart=1-smooth(.4,2,t),seedEnd=smooth(18,19.7,t),seedAlpha=Math.max(seedStart,seedEnd),seed=project({x:0,y:0,z:0});
 glow(seed.x,seed.y,29,'#b5f2be',seedAlpha*.13);dot(seed.x,seed.y,2.2,'#e8ffdb',seedAlpha*.8);
 if(t>16.6&&t<19.7){const u=smooth(16.6,19.5,t),q=project({x:(100*(1-u)+Math.sin(Math.PI*u)*75),y:325*(1-u),z:12*Math.sin(Math.PI*u)}),alpha=smooth(16.6,17.2,t)*(1-smooth(19.2,19.7,t));glow(q.x,q.y,19,'#eddeb0',alpha*.13);dot(q.x,q.y,2,'#fff1c8',alpha*.95)}
}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,3);width=r.width;height=r.height;canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);if(width&&height){buildBackground();draw(motion.matches?11:time)}}
new ResizeObserver(resize).observe(canvas);
function tick(now){if(last!==null&&!document.hidden&&active&&!motion.matches){time=(time+(now-last)/1000)%PERIOD;draw(time)}last=now;requestAnimationFrame(tick)}requestAnimationFrame(tick);
document.addEventListener('visibilitychange',()=>{last=null});
motion.addEventListener('change',()=>{last=null;draw(motion.matches?11:time)});
if(typeof IntersectionObserver!=='undefined')new IntersectionObserver(entries=>{active=Boolean(entries[0]?.isIntersecting);last=null}).observe(canvas);
window.aunoraFlower={seek(t){time=((Number(t)||0)%PERIOD+PERIOD)%PERIOD;draw(time)},get state(){return{time,period:PERIOD,width,height}}};
})();
