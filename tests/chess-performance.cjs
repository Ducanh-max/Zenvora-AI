const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),ts=require("typescript"),assert=require("node:assert/strict"),{performance}=require("node:perf_hooks");
const modules=new Map();
function load(file,overrides={}){
 const full=path.resolve(file);if(!Object.keys(overrides).length&&modules.has(full))return modules.get(full);
 const code=ts.transpileModule(fs.readFileSync(full,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const ctx={exports:{},console,Buffer,Date,Map,Set,Symbol,setTimeout,clearTimeout,require(name){if(name in overrides)return overrides[name];if(name.startsWith("./"))return load(path.join(path.dirname(full),name+".ts"));return require(name);}};
 Object.assign(ctx,overrides.__globals||{});vm.runInNewContext(code,ctx,{filename:full});if(!Object.keys(overrides).length)modules.set(full,ctx.exports);return ctx.exports;
}
const e=load("lib/chess-engine.ts"),s=load("lib/chess-stockfish.ts"),{locateChessPieces}=load("lib/chess-pieces.ts");
const idx=x=>(8-Number(x[1]))*8+"abcdefgh".indexOf(x[0]);
function move(p,from,to,promotion){const m=e.legal(p).find(m=>m.from===idx(from)&&m.to===idx(to)&&m.promotion===promotion);assert.ok(m,from+to);return e.execute(p,m);}
function pieceAt(p,square){return locateChessPieces(p).find(x=>x.square===idx(square));}
(async()=>{
 let p=e.start(),pawn=pieceAt(p,"e2").id;p=move(p,"e2","e4");assert.equal(pieceAt(p,"e4").id,pawn,"local optimistic move keeps the same image identity");assert.equal(locateChessPieces(p).map(x=>x.id).join(),locateChessPieces(e.start()).map(x=>x.id).join(),"moving pieces keep DOM order as well as keys");const snapshot=JSON.parse(JSON.stringify(p));assert.equal(pieceAt(snapshot,"e4").id,pawn,"server echo keeps identity without a snap");
 p=move(p,"d7","d5");p=move(p,"e4","d5");assert.equal(pieceAt(p,"d5").id,pawn);assert.equal(locateChessPieces(p).length,31);
 let castle=e.start();for(const [a,b] of [["g1","f3"],["g8","f6"],["g2","g3"],["g7","g6"],["f1","g2"],["f8","g7"]])castle=move(castle,a,b);
 const king=pieceAt(castle,"e1").id,rook=pieceAt(castle,"h1").id;castle=move(castle,"e1","g1");assert.equal(pieceAt(castle,"g1").id,king);assert.equal(pieceAt(castle,"f1").id,rook);
 let ep=e.start();for(const [a,b] of [["e2","e4"],["a7","a6"],["e4","e5"],["d7","d5"],["e5","d6"]])ep=move(ep,a,b);assert.equal(locateChessPieces(ep).length,31);assert.ok(!pieceAt(ep,"d5"));
 assert.equal(s.stockfishFen(e.start()),"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
 assert.match(s.stockfishFen(move(e.start(),"e2","e4")),/ b KQkq e3 0 1$/);
 const position=move(e.start(),"e2","e4"),timings={};let ticks=0;
 const pulse=setInterval(()=>ticks++,5);
 try{for(const level of ["easy","medium","hard","expert"]){const t=performance.now(),chosen=await s.chooseStockfishMove(position,level);timings[level]=Math.round(performance.now()-t);assert.ok(e.legal(position).some(m=>JSON.stringify(m)===JSON.stringify(chosen)),level+" returns a legal move");assert.ok(timings[level]<2500,level+" startup + search budget");}}finally{clearInterval(pulse);}
 assert.ok(ticks>20,"engine computation leaves JS event loop responsive");
 let mate=e.start();for(const [a,b] of [["f2","f3"],["e7","e5"],["g2","g4"]])mate=move(mate,a,b);
 const winning=await s.chooseStockfishMove(mate,"expert"),after=e.execute(mate,winning);assert.equal(e.legal(after).length,0);assert.ok(e.attacked(after,after.board.indexOf("K"),"b"));
 const cancelled=new AbortController();cancelled.abort();await assert.rejects(s.chooseStockfishMove(position,"expert",cancelled.signal),/hủy/);
 const liveCancel=new AbortController();const stopped=s.chooseStockfishMove(position,"expert",liveCancel.signal);liveCancel.abort();await assert.rejects(stopped,/hủy/);
 // Exercise stop/error protocol paths without waiting for the real watchdog.
 const {EventEmitter}=require("node:events");let child,killed=0,deadline;
 function fakeSpawn(){child=new EventEmitter();child.stdin=new EventEmitter();child.stdin.write=()=>{};child.stdout=new EventEmitter();child.stdout.setEncoding=()=>{};child.stderr={resume(){}};child.kill=()=>{killed++;};return child;}
 const mocked=load("lib/chess-stockfish.ts",{"node:child_process":{spawn:fakeSpawn},__globals:{setTimeout(fn){deadline=fn;return 1;},clearTimeout(){}}});
 const bad=mocked.chooseStockfishMove(position,"hard");child.stdout.emit("data","uciok\nreadyok\nbestmove a1a8\n");await assert.rejects(bad,/không hợp lệ/);assert.equal(killed,1);
 const hanging=mocked.chooseStockfishMove(position,"hard");deadline();await assert.rejects(hanging,/khởi động chậm/);assert.equal(killed,2);
 console.log("PASS: Stockfish WASM legal moves at all levels, mate, FEN, isolated nonblocking execution, cancellation, invalid output, watchdog and child cleanup.");
 console.log("Measured startup + search (ms): "+JSON.stringify(timings)+"; responsive event-loop ticks: "+ticks);
 console.log("PASS: stable moving piece identities for rooms and bots, server echo, captures, castling and en passant.");
})().catch(error=>{console.error(error);process.exitCode=1;});
