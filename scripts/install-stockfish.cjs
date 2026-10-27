// Pinned upstream WASM release; verify every byte before it can run.
const fs=require("node:fs/promises"),path=require("node:path"),{createHash,randomUUID}=require("node:crypto");
const directory=path.join(__dirname,"../vendor/stockfish");
const assets={
 "stockfish-19-lite-single.js":"ccb130d7ff29408531c47d859a49f91d59d4f482d05a53eb1a3231a4f624c91a",
 "stockfish-19-lite-single.wasm":"ee4f115bdb2d32cadf96cada104a05b5ec257d7ad6f57582190b49bc71f096de"
};
const digest=bytes=>createHash("sha256").update(bytes).digest("hex");
async function install(){
 await fs.mkdir(directory,{recursive:true});
 for(const [name,expected] of Object.entries(assets)){
  const target=path.join(directory,name);
  try{if(digest(await fs.readFile(target))===expected)continue;}catch{}
  const response=await fetch("https://github.com/nmrugg/stockfish.js/releases/download/v19.0.1/"+name,{signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw Error("Stockfish download failed: "+response.status);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(digest(bytes)!==expected)throw Error("Stockfish checksum mismatch: "+name);
  const temporary=target+"."+randomUUID()+".tmp";
  try{await fs.writeFile(temporary,bytes);await fs.rename(temporary,target);}finally{await fs.rm(temporary,{force:true});}
 }
 console.log("Stockfish 19 Lite WASM: verified and ready.");
}
install().catch(error=>{console.error(error.message);process.exitCode=1;});
