const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(file, overrides = {}) {
 const exports = {};
 const source = ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }}).outputText;
 vm.runInNewContext(source, { exports, require: name => name in overrides ? overrides[name] : require(name), process, URL, console });
 return exports;
}
const helpers = load('lib/password-recovery.ts');
test('new passwords must match and meet length bounds', () => {
 assert.ok(helpers.validateNewPassword('short','short'));
 assert.ok(helpers.validateNewPassword('longenough','different'));
 assert.ok(helpers.validateNewPassword('x'.repeat(129),'x'.repeat(129)));
 assert.equal(helpers.validateNewPassword('a Strong password!','a Strong password!'),'');
});
test('OTP verification is recovery-only and requires a real Auth session', async () => {
 let captured;
 await helpers.verifyRecoveryCode({auth:{verifyOtp: async input => { captured=input; return {data:{session:{access_token:'fixture'}},error:null}; }}},' Test@example.com ','123456');
 assert.equal(captured.type,'recovery'); assert.equal(captured.email,'test@example.com'); assert.equal(captured.token,'123456');
 await assert.rejects(helpers.verifyRecoveryCode({auth:{verifyOtp: async()=>({data:{session:null},error:null})}},'test@example.com','123456'));
 await assert.rejects(helpers.verifyRecoveryCode({auth:{verifyOtp: async()=>({data:{session:null},error:{code:'otp_expired'}})}},'test@example.com','123456'));
 await assert.rejects(helpers.verifyRecoveryCode({},'test@example.com','bad'));
});
const userId='12345678-1234-1234-1234-123456789abc';
function route(role='admin', sendError=null) {
 const calls=[];
 const module=load('app/api/admin/password-recovery/route.ts',{
  'next/server': {NextResponse:{json:(data,{status})=>({data,status})}},
  '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:role ? {id:'actor',app_metadata:{role}} : null},error:null})}})},
  '@/lib/password-recovery':helpers,
  '@supabase/supabase-js':{createClient:(url,key)=>{ calls.push(['client',key]);return {auth:{admin:{getUserById:async id=>{calls.push(['lookup',id]);return {data:{user:{email:'owner@example.test'}},error:null}}},resetPasswordForEmail:async(email,options)=>{calls.push(['send',email,options]);return {error:sendError}}}}}}
 });
 return {POST:module.POST,calls};
}
function request(body={userId},origin='https://aunora.example') {return {url:'https://aunora.example/api/admin/password-recovery',headers:{get:()=>origin},text:async()=>JSON.stringify(body)}}
process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.example';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='public-fixture';process.env.SUPABASE_SERVICE_ROLE_KEY='secret-fixture';
test('anonymous and regular accounts cannot initiate admin recovery',async()=>{
 for(const [role,status] of [[null,401],['user',403]]){const r=route(role);assert.equal((await r.POST(request())).status,status);assert.equal(r.calls.length,0)}
});
test('cross-origin requests and unvalidated targets never use privileged lookup',async()=>{
 const r=route();assert.equal((await r.POST(request({},'https://evil.test'))).status,403);assert.equal((await r.POST(request({userId:'invalid'}))).status,400);assert.equal(r.calls.length,0);
});
test('admin recovery sends only to Auth account email and returns no credentials',async()=>{
 const r=route();const result=await r.POST(request({userId,email:'attacker@example.test'}));assert.equal(result.status,200);assert.equal(r.calls[1][1],userId);assert.equal(r.calls[3][0],'send');assert.equal(r.calls[3][1],'owner@example.test');assert.equal(r.calls[3][2].redirectTo,'https://aunora.example/reset-password');assert.deepEqual(Object.keys(result.data),['message']);assert.ok(!JSON.stringify(result).includes('secret-fixture'));
});
test('upstream failures are localized without exposing raw provider details',async()=>{
 const r=route('admin',{code:'over_email_send_rate_limit',message:'private provider detail'});const result=await r.POST(request());assert.equal(result.status,429);assert.ok(!JSON.stringify(result).includes('private provider detail'));
});

