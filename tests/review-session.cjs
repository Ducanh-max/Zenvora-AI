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
