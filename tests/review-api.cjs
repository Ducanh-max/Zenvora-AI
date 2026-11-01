const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),ts=require("typescript");
const cache=new Map(),fixed=Date.parse("2026-11-01T12:00:00.000Z");let signedIn=true,writes=0,rows=[],future=false,scopes=[];
class Clock extends Date{constructor(...args){super(...(args.length?args:[fixed]));}static now(){return fixed;}}
const db={auth:{getUser:async()=>({data:{user:signedIn?{id:"owner"}:null}})},from(table){
 assert.equal(table,"aunora_review_items");
 return {select(fields){assert.equal(fields,"task_id,streak,due_at");return this;},eq(column,value){scopes.push([column,value]);return this;},in(_column,ids){return Promise.resolve({data:ids.map(id=>({task_id:id,streak:2,due_at:future?"2026-11-10T00:00:00.000Z":"2026-10-31T00:00:00.000Z"})),error:null});},upsert(values){writes++;rows=values;return {select:async fields=>{assert.equal(fields,"task_id,due_at,streak");return {data:values.map(row=>({task_id:row.task_id,due_at:row.due_at,streak:row.streak})),error:null};}};}};
}};
function load(file){
 const full=path.resolve(file);if(cache.has(full))return cache.get(full).exports;const module={exports:{}};cache.set(full,module);
 const code=ts.transpileModule(fs.readFileSync(full,"utf8"),{compilerOptions:{module:1,jsx:4,target:7}}).outputText;
 const req=name=>{if(name==="@/lib/supabase/server")return {createClient:async()=>db};if(name.startsWith("@/"))return load(name.slice(2)+".ts");return require(name);};
 vm.runInNewContext(code,{require:req,module,exports:module.exports,Date:Clock,console,URL},{filename:full});return module.exports;
}
(async()=>{
 const {POST}=load("app/api/lesson-review/route.ts");
 const request=(attempts,origin="https://example.invalid")=>new Request("https://example.invalid/api/lesson-review",{method:"POST",headers:{"Content-Type":"application/json",origin},body:JSON.stringify({user_id:"attacker",mode:"review",attempts})});
 let response=await POST(request([{taskId:"3a",correct:false,assisted:false}]));
 assert.equal(response.status,200);let data=await response.json();
 assert.equal(data.items[0].due_at,"2026-11-02T12:00:00.000Z");assert.equal(data.items[0].streak,0);assert.equal(rows[0].user_id,"owner");assert.equal(data.items[0].user_id,undefined);assert(scopes.some(([key,id])=>key==="user_id"&&id==="owner"));
 response=await POST(request([{taskId:"3j",correct:true,assisted:false}]));data=await response.json();assert.equal(data.items[0].due_at,"2026-11-08T12:00:00.000Z");
 response=await POST(request([{taskId:"2a",correct:true,assisted:true}]));data=await response.json();assert.equal(data.items[0].due_at,"2026-11-02T12:00:00.000Z");
 const count=writes;future=true;assert.equal((await POST(request([{taskId:"3a",correct:true,assisted:false}]))).status,409);assert.equal(writes,count);
 future=false;assert.equal((await POST(request([{taskId:"unknown",correct:true,assisted:false}]))).status,400);
 assert.equal((await POST(request([{taskId:"3a",correct:true,assisted:false}],"https://attacker.invalid"))).status,403);
 signedIn=false;assert.equal((await POST(request([{taskId:"3a",correct:true,assisted:false}]))).status,401);assert.equal(writes,count);
 console.log("PASS: returned saved review dates, owner scoping, wrong/help intervals, future-item/invalid/origin/auth rejection.");
})().catch(error=>{console.error(error);process.exitCode=1;});
