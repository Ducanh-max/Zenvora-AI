const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),ts=require("typescript");
const cache=new Map();
const moduleMocks={};const runtime={env:{},fetch:()=>{throw Error("unexpected provider call");}};
function load(file){
 const full=path.resolve(file);if(cache.has(full))return cache.get(full).exports;
 const module={exports:{}};cache.set(full,module);
 const source=ts.transpileModule(fs.readFileSync(full,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 const req=name=>{if(moduleMocks[name])return moduleMocks[name];if(name.endsWith(".css"))return {};if(name.startsWith("@/"))return load(name.slice(2)+".ts");if(name.startsWith(".")){const base=path.resolve(path.dirname(full),name);return load([base+".ts",base+".tsx",base].find(p=>fs.existsSync(p)));}return require(name);};
 vm.runInNewContext(source,{require:req,module,exports:module.exports,console,Date,setTimeout,clearTimeout,process:{env:runtime.env},fetch:(...args)=>runtime.fetch(...args)},{filename:full});return module.exports;
}
const {nextReview}=load("lib/lesson-review.ts");
const now=Date.UTC(2026,9,30,8),day=86400000;
let streak=0;
for(const interval of [1,3,7,14,30,30]){const result=nextReview(streak,true,false,now);assert.equal(Date.parse(result.due_at),now+interval*day);streak=result.streak;}
for(const [correct,assisted] of [[false,false],[true,true],[false,true]]){const result=nextReview(4,correct,assisted,now);assert.equal(result.streak,0);assert.equal(Date.parse(result.due_at),now+day);}
const {sampleLessons}=load("app/learn/library/sample-intro-content.ts");
assert.equal(sampleLessons.length,4);assert.equal(new Set(sampleLessons.flatMap(l=>l.tasks.map(t=>t.id))).size,42);
for(const lesson of sampleLessons.slice(0,3)){assert.equal(lesson.tasks.length,10);assert.equal(lesson.questions.length,2);assert(lesson.tasks.some(t=>t.kind==="write"));assert(lesson.tasks.some(t=>t.kind==="dialogue"&&!t.options));}
assert.equal(sampleLessons[3].questions.length,0);assert.equal(sampleLessons[3].tasks.length,12);
const React=require("react"),{renderToStaticMarkup}=require("react-dom/server");
const {Exercise}=load("app/learn/library/sample-intro-lesson.tsx");
function render(task,assessment=false){return renderToStaticMarkup(React.createElement(Exercise,{task,newWords:["name"],assessment,onDone:()=>{}}));}
for(const kind of ["match","audioMatch"]){const task=sampleLessons.flatMap(l=>l.tasks).find(t=>t.kind===kind);const html=render(task,true);assert(html.includes("Tiếp tục"));assert(!html.includes(">Kiểm tra<"));assert(html.includes("disabled"));}
assert(render(sampleLessons[0].tasks.find(t=>t.kind==="write"),true).includes("<input"));
const dialogue=render(sampleLessons[0].tasks.find(t=>t.id==="1c"));
assert(!dialogue.includes("A — một"));assert(dialogue.includes("name"));
console.log("PASS: review intervals/reset, 4-lesson curriculum, free writing, matching Continue, speaker-label glossary.");

const {gradeTask,gradeParagraph,ageCorrection,firstTryPassed,parseTutorFeedback}=load("lib/lesson-grading.ts");
const football=sampleLessons[2].tasks.find(t=>t.id==="3j");
for(const response of ["I like to play football.","I like playing football.","I like playing soccer.","I enjoy playing football.","I like football."]){assert(gradeTask(football,response).correct,response);}
for(const response of ["I do not like playing football.","I like to playing football.","She likes playing football.","I like music.","I play football."]){assert(!gradeTask(football,response).correct,response);}
const meeting=sampleLessons[0].tasks.find(t=>t.id==="1h");
for(const response of ["It's nice to meet you.","It is a pleasure to meet you.","I am pleased to meet you."]){assert(gradeTask(meeting,response).correct,response);}
const personal=sampleLessons[1].tasks.find(t=>t.id==="2i");
for(const response of ["I'm a student and I live in Hanoi.","I live in Hanoi. I'm a student.","I am a student living in Hanoi."]){assert(gradeTask(personal,response).correct,response);}
assert(!gradeTask(personal,"I live in Tokyo and I am a student.").correct);
assert(ageCorrection("I have twelve years").includes("I am twelve years old"));
assert(ageCorrection("I have thirteen years").includes("I am thirteen years old"));
assert.equal(ageCorrection("I have twelve years of experience."),null);
assert(gradeParagraph("I'm Alex. I live in Hanoi. I like football.").correct);
assert(gradeParagraph("My name is Linh. I am twelve. I like reading.").correct);
assert(!gradeParagraph("I am a student. I live in Hanoi. I like music.").correct);
assert(!gradeParagraph("My name is Alex. I have twelve years. I like music.").correct);
assert(!gradeParagraph("Hi, I'm Alex.").correct);
assert(!firstTryPassed(true,false,{firstTryCorrect:false,mistakes:3}));
assert(!firstTryPassed(true,true,{firstTryCorrect:true,mistakes:0}));
assert(firstTryPassed(true,false,{firstTryCorrect:true,mistakes:0}));
assert.equal(parseTutorFeedback(JSON.stringify({status:"grammar",reply:"Dùng be để nói tuổi."})).status,"grammar");
assert.equal(parseTutorFeedback("plain ungraded feedback"),null);
assert.equal(sampleLessons[3].tasks.at(-1).kind,"introWrite");
assert(render(sampleLessons[3].tasks.at(-1),true).includes("<textarea"));
assert(!render(sampleLessons[3].tasks.at(-1),true).includes('aria-label="Khay từ"'));
assert(render(sampleLessons[0].tasks.find(t=>t.kind==="listenOrder")).includes("Không nghe được"));
assert(render(sampleLessons[2].tasks.find(t=>t.kind==="audioMatch")).includes("Không nghe được"));
console.log("PASS: equivalent answers and negatives; age explanations; paragraph rubric; first-attempt evidence; audio fallback; structured tutor feedback.");

(async()=>{
 let quotaCalls=0,providerCalls=0,signedIn=true;
 moduleMocks["@/lib/supabase/server"]={createClient:async()=>({auth:{getUser:async()=>({data:{user:signedIn?{id:"learner",app_metadata:{}}:null},error:null})}})};
 moduleMocks["@supabase/supabase-js"]={createClient:()=>({rpc:async()=>{quotaCalls++;return {data:[{allowed:true,used:quotaCalls,quota:20,remaining:20-quotaCalls}],error:null};}})};
 Object.assign(runtime.env,{GROQ_API_KEY:"test-only",NEXT_PUBLIC_SUPABASE_URL:"https://example.invalid",SUPABASE_SERVICE_ROLE_KEY:"test-only"});
 const {POST}=load("app/api/tutor/route.ts");
 const request=(question,answer)=>new Request("https://example.invalid/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"intro_sample_feedback",messages:[{role:"assistant",content:question},{role:"user",content:answer}]})});
 const age=await POST(request("How old are you?","I have twelve years"));
 assert.equal(age.status,200);const ageBody=await age.json();assert.equal(ageBody.feedbackStatus,"grammar");assert(ageBody.reply.includes("I am twelve years old"));assert.equal(quotaCalls,1);assert.equal(providerCalls,0);
 runtime.fetch=async()=>{providerCalls++;return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({status:"correct",reply:"Đúng và tự nhiên!"})}}]})};};
 const natural=await POST(request("What do you like?","I like to play football."));
 assert.equal((await natural.json()).feedbackStatus,"correct");assert.equal(quotaCalls,2);assert.equal(providerCalls,1);
 runtime.fetch=async()=>({ok:true,json:async()=>({choices:[{message:{content:"unstructured response"}}]})});
 assert.equal((await POST(request("What is your name?","I'm Alex."))).status,502);
 signedIn=false;const before=quotaCalls;assert.equal((await POST(request("How old are you?","I have twelve years"))).status,401);assert.equal(quotaCalls,before);
 console.log("PASS: authenticated tutor retries, quota before age correction, natural answer status, malformed verdict rejection.");
})().catch(error=>{console.error(error);process.exitCode=1;});
