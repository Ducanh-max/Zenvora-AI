const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),ts=require("typescript");
const cache=new Map();
function load(file){
 const full=path.resolve(file);if(cache.has(full))return cache.get(full).exports;
 const module={exports:{}};cache.set(full,module);
 const source=ts.transpileModule(fs.readFileSync(full,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 const req=name=>{if(name.endsWith(".css"))return {};if(name.startsWith(".")){const base=path.resolve(path.dirname(full),name);return load([base+".ts",base+".tsx",base].find(p=>fs.existsSync(p)));}return require(name);};
 vm.runInNewContext(source,{require:req,module,exports:module.exports,console,Date,setTimeout,clearTimeout},{filename:full});return module.exports;
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
