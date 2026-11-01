const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),ts=require("typescript");
const React=require("react");
let slots=[],cursor=0;
const hooks={...React,
 useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==="function"?initial():initial;return [slots[i],value=>{slots[i]=typeof value==="function"?value(slots[i]):value;}];},
 useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
 useMemo(fn){return fn();},useEffect(){}
};
const cache=new Map();
function load(file){
 const full=path.resolve(file);if(cache.has(full))return cache.get(full).exports;
 const module={exports:{}};cache.set(full,module);
 const code=ts.transpileModule(fs.readFileSync(full,"utf8"),{compilerOptions:{module:1,jsx:4,target:7}}).outputText;
 const req=name=>{if(name==="react")return hooks;if(name.endsWith(".css"))return {};if(name.startsWith("@/"))return load(name.slice(2)+".ts");if(name.startsWith(".")){const base=path.resolve(path.dirname(full),name);return load([base+".ts",base+".tsx",base].find(fs.existsSync));}return require(name);};
 vm.runInNewContext(code,{require:req,module,exports:module.exports,console,Date,setTimeout,clearTimeout},{filename:full});return module.exports;
}
const {Exercise}=load("app/learn/library/sample-intro-lesson.tsx");
const {sampleLessons}=load("app/learn/library/sample-intro-content.ts");
const task=sampleLessons[1].tasks.find(task=>task.kind==="speak");
let result=null;
const props={task,newWords:[],assessment:true,onDone:(...args)=>{result=args;}};
function render(){cursor=0;return Exercise(props);}
function nodes(node){if(!node)return [];if(Array.isArray(node))return node.flatMap(nodes);if(typeof node!=="object")return [];return [node,...nodes(node.props?.children)];}
let tree=render();
assert(nodes(tree).some(n=>n.type==="output"));assert(!nodes(tree).some(n=>n.type==="input"));
nodes(tree).find(n=>n.type==="button"&&n.props.children==="Chuyển sang luyện viết").props.onClick();
tree=render();
const input=nodes(tree).find(n=>n.type==="input");assert(input);input.props.onChange({target:{value:task.answer}});
tree=render();nodes(tree).find(n=>n.type==="button"&&n.props.className==="si-primary").props.onClick();
tree=render();nodes(tree).find(n=>n.type==="button"&&n.props.className==="si-primary").props.onClick();
assert(result);assert.equal(result[0],true);assert.equal(result[2],true);assert.equal(result[3].inputMode,"typed");assert.equal(result[3].typedInsteadOfSpeech,true);assert.equal(result[3].pronunciationAssessed,false);
console.log("PASS: speech -> explicit writing fallback -> content check -> assisted typed evidence; no pronunciation score.");

slots=[];cursor=0;result=null;
const matching=sampleLessons[2].tasks.find(task=>task.kind==="audioMatch");
const matchingProps={task:matching,newWords:[],assessment:true,onDone:(...args)=>{result=args;}};
cursor=0;tree=Exercise(matchingProps);
const board=nodes(tree).find(node=>node.type===load("app/learn/library/sample-intro-lesson.tsx").PairBoard);
assert(board);board.props.onMistake();board.props.onMistake();board.props.onMistake();board.props.onComplete();
cursor=0;tree=Exercise(matchingProps);nodes(tree).find(n=>n.type==="button"&&n.props.className==="si-primary").props.onClick();
assert(result);assert.equal(result[0],true);assert.equal(result[3].firstTryCorrect,false);assert.equal(result[3].mistakes,3);
console.log("PASS: three audio-matching errors remain in completed-attempt evidence.");

// Exercise the parent completion handlers: an in-place repair and a review repair
// count once each, while a first-try success does not count as a repair.
const Lesson=load("app/learn/library/sample-intro-lesson.tsx").default;
const {IntroFieldNotes}=load("app/learn/library/intro-field-notes.tsx");
slots=[];cursor=0;
const lessonProps={lessonIndex:0,onExit:()=>{},onFinish:async()=>{}};
function lessonRender(){cursor=0;return Lesson(lessonProps);}
lessonRender();slots[0]=true;slots[2]=sampleLessons[0].tasks;
tree=lessonRender();
nodes(tree).find(n=>n.type===Exercise).props.onDone(true,"repaired",false,{firstTryCorrect:false,mistakes:2});
tree=lessonRender();
nodes(tree).find(n=>n.type===Exercise).props.onDone(true,"first try",false,{firstTryCorrect:true,mistakes:0});
tree=lessonRender();
nodes(tree).find(n=>n.type===Exercise).props.onDone(false,"wrong",false,{firstTryCorrect:false,mistakes:1});
slots[3]=slots[2].length;slots[5]=true;
tree=lessonRender();
nodes(tree).find(n=>n.type==="button"&&n.props.children==="Bắt đầu ôn tập →").props.onClick();
tree=lessonRender();nodes(tree).find(n=>n.type===Exercise).props.onDone(true,"reviewed");
tree=lessonRender();const notes=nodes(tree).find(n=>n.type===IntroFieldNotes);
assert(notes);assert.equal(notes.props.mastered,2);assert.equal(notes.props.score,1);
console.log("PASS: summary counts in-place repairs and review repairs without counting first-try successes.");

function visibleText(node){if(typeof node==="string")return node;if(Array.isArray(node))return node.map(visibleText).join(" ");return node&&typeof node==="object"?visibleText(node.props?.children):"";}
for(const [response,expected] of [["reading books",true],["to read books",true],["not reading books",false]]){
 slots=[];cursor=0;result=null;
 const props={task:sampleLessons[2].tasks.find(task=>task.id==="3h"),newWords:[],assessment:true,onDone:(...args)=>{result=args;}};
 function exercise(){cursor=0;return Exercise(props);}
 tree=exercise();nodes(tree).find(n=>n.type==="input").props.onChange({target:{value:response}});
 tree=exercise();nodes(tree).find(n=>n.type==="button"&&n.props.className==="si-primary").props.onClick();
 tree=exercise();assert(visibleText(tree).includes(expected?"✓ Chính xác!":"phủ định"),response);
 nodes(tree).find(n=>n.type==="button"&&n.props.className==="si-primary").props.onClick();
 assert.equal(result[0],expected);assert.equal(result[3].firstTryCorrect,expected);
}
console.log("PASS: reading phrases pass in the rendered exercise; negation gives a specific visible explanation.");
