import test from 'node:test';
import assert from 'node:assert/strict';
import {createLab,labIds} from '../dist/assets/security-labs.js';
import * as m from '../dist/assets/security-models.js';
import {securityLessons,securitySources} from '../dist/assets/security-curriculum.js';

test('unverified claims do not establish authority',()=>{
 for(const source of ['Browser header','Queue message'])assert.equal(m.trustDecision(source,false),false);
 assert.equal(m.trustDecision('Verified server session',false),true);
 assert.equal(m.trustDecision('Browser header',true),true);
});
test('closing one route leaves independent paths open',()=>{
 const paths=m.attackPaths({objectCheck:true,privateStorage:false,scopedBuild:false});
 assert.deepEqual(paths.map(p=>p.blocked),[true,false,false]);
 assert.deepEqual(m.permissionSets['Order worker'],['Read orders','Update orders']);
});
test('salts separate offline work; KDF cost and lanes affect elapsed time',()=>{
 const shared=m.passwordCost(100,10,false,1),salted=m.passwordCost(100,10,true,1);
 assert.equal(salted.work,shared.work*10);
 assert.equal(m.passwordCost(200,10,true,1).seconds,salted.seconds*2);
 assert.equal(m.passwordCost(100,10,true,4).seconds,salted.seconds/4);
});
test('freshness and origin binding reject different proof failures',()=>{
 for(const kind of ['Password + OTP','Origin-bound passkey'])assert.equal(m.factorResult(kind,false,false).accepted,false);
 assert.equal(m.factorResult('Password + OTP',true,true).accepted,true);
 assert.equal(m.factorResult('Origin-bound passkey',true,true).accepted,false);
 assert.equal(m.factorResult('Origin-bound passkey',false,true).accepted,true);
});
test('session rotation, expiry boundary, and server revocation reject copied credentials',()=>{
 const s={loggedIn:true,currentId:'S1',now:59,expires:60,revoked:false};
 assert.equal(m.sessionAccept(s,'S1'),true);assert.equal(m.sessionAccept(s,'S0'),false);
 assert.equal(m.sessionAccept({...s,now:60},'S1'),false);
 assert.equal(m.sessionAccept({...s,revoked:true},'S1'),false);
 assert.equal(m.sessionAccept({...s,loggedIn:false},'S1'),false);
 assert.equal(m.sessionAccept({...s,currentId:'S0'},'S0'),true);
});
test('PKCE rejects interceptor without verifier but permits original client',()=>{
 assert.equal(m.codeRedemption(true,true),false);assert.equal(m.codeRedemption(true,false),true);
 assert.equal(m.codeRedemption(false,true),true);
 for(const key of ['redirect','correlated'])assert.equal(m.oauthChecks({redirect:true,correlated:true,stolen:false,pkce:true,[key]:false}).every(x=>x[1]),false);
});
test('object policy requires authentication and denies unknown authority',()=>{
 for(const role of ['Viewer','Editor','Admin','Unknown'])for(const action of ['Read','Edit','Other'])for(const owner of [true,false]){
  assert.equal(m.objectAccess({authenticated:false,role,action,owner}),false);
  if(role==='Unknown'||action==='Other')assert.equal(m.objectAccess({authenticated:true,role,action,owner}),false);
 }
 assert.equal(m.objectAccess({authenticated:true,role:'Viewer',action:'Edit',owner:true}),false);
 assert.equal(m.objectAccess({authenticated:true,role:'Editor',action:'Edit',owner:true}),true);
 assert.equal(m.objectAccess({authenticated:true,role:'Editor',action:'Read',owner:false}),false);
});
test('tenant safety covers cache hits independently of scoped SQL',()=>{
 const s={cacheHit:true,cacheScoped:false,queryScoped:true,enforceTenant:false};
 assert.equal(m.tenantRead(s).leak,true);
 assert.equal(m.tenantRead({...s,cacheHit:false}).leak,false);
 assert.equal(m.tenantRead({...s,cacheScoped:true}).leak,false);
 assert.deepEqual(m.tenantRead({...s,enforceTenant:true}),{returnedTenant:'B',allowed:false,leak:false});
 for(const cacheHit of [true,false])for(const cacheScoped of [true,false])for(const queryScoped of [true,false])assert.equal(m.tenantRead({cacheHit,cacheScoped,queryScoped,enforceTenant:true}).leak,false);
});
test('explicit policy cannot grant unknown operations or write locked records',()=>{
 for(const role of ['Viewer','Editor','Admin','Unknown'])for(const owns of [true,false]){
  assert.equal(m.policyDecision(role,'New action',owns,false).allowed,false);
  for(const action of ['Edit','Delete'])assert.equal(m.policyDecision(role,action,owns,true).allowed,false);
 }
 assert.equal(m.policyDecision('Admin','Read',false,true).allowed,true);
 assert.equal(m.policyDecision('Editor','Delete',true,false).allowed,false);
});
test('token acceptance needs every trust gate and exclusive expiry',()=>{
 assert.equal(m.tokenChecks('Valid token',59).every(x=>x[1]),true);
 assert.equal(m.tokenChecks('Valid token',60).every(x=>x[1]),false);
 for(const profile of ['Bad signature','Unapproved algorithm','Wrong issuer','Wrong audience'])assert.equal(m.tokenChecks(profile,10).filter(x=>!x[1]).length,1);
});
test('bound SQL-looking input stays a nonmatching value',()=>{
 assert.deepEqual(m.injectionOutcome(true,true),{structureChanged:false,rows:0});
 assert.deepEqual(m.injectionOutcome(false,true),{structureChanged:true,rows:3});
 assert.equal(m.injectionOutcome(true,false).rows,1);
});
test('CORS response gate does not undo simple credentialed POST',()=>{
 const s={sameSite:'None',originCheck:false,tokenCheck:false,cors:false};
 assert.deepEqual(m.csrfModel(s),{sent:true,cookie:true,changed:true,responseReadable:false});
 assert.equal(m.csrfModel({...s,cors:true}).changed,true);
 for(const key of ['originCheck','tokenCheck'])assert.equal(m.csrfModel({...s,[key]:true}).changed,false);
 for(const sameSite of ['Lax','Strict'])assert.equal(m.csrfModel({...s,sameSite}).cookie,false);
});
test('SSRF redirect validation and egress each stop the internal route',()=>{
 const route='Allowed host redirects inward';
 assert.equal(m.ssrfModel(route,false,false).internalReached,true);
 assert.equal(m.ssrfModel(route,true,false).internalReached,false);
 assert.equal(m.ssrfModel(route,false,true).internalReached,false);
 assert.equal(m.ssrfModel('Direct internal address',false,false).appBlocked,true);
 assert.equal(m.ssrfModel('Allowed public host',false,false).internalReached,false);
});
test('TLS identity failure blocks first channel; termination bounds protection',()=>{
 const s={hostname:true,chain:true,expired:false,edgeOnly:true};
 assert.deepEqual(m.tlsModel(s),{authenticated:true,clientToEdge:true,edgeToService:false});
 assert.equal(m.tlsModel({...s,edgeOnly:false}).edgeToService,true);
 for(const change of [{hostname:false},{chain:false},{expired:true}])assert.equal(m.tlsModel({...s,...change}).clientToEdge,false);
});
test('AEAD rejects altered context; valid tags do not prove nonce discipline',()=>{
 const s={tamper:false,aadChanged:false,wrongKey:false,reuseNonce:false};
 for(const key of ['tamper','aadChanged','wrongKey'])assert.equal(m.aeadModel({...s,[key]:true}).verified,false);
 assert.deepEqual(m.aeadModel({...s,reuseNonce:true}),{verified:true,secureUse:false});
});
test('activating a key does not migrate old envelopes',()=>{
 const s={rotated:true,rewrapped:false,oldKeyPresent:false};
 assert.equal(m.keyRotation(s).oldReadable,false);
 assert.equal(m.keyRotation({...s,rewrapped:true}).oldReadable,true);
 assert.equal(m.keyRotation({...s,rotated:false}).newWritesKey,'Unavailable');
});
test('deletion follows each copy deadline only after a request',()=>{
 assert.equal(m.retainedCopies(35,false).filter(x=>x.present).length,4);
 for(const [day,count]of [[0,3],[1,2],[7,1],[30,0]])assert.equal(m.retainedCopies(day,true).filter(x=>x.present).length,count);
});
test('a signed build still needs an approved builder and source',()=>{
 const s={digest:true,signature:true,builder:true,source:true};
 assert.equal(m.provenanceChecks(s).every(x=>x[1]),true);
 for(const key of Object.keys(s))assert.equal(m.provenanceChecks({...s,[key]:false}).every(x=>x[1]),false);
});
test('secret replacement and revocation have separate availability effects',()=>{
 const s={newIssued:true,clientNew:true,oldRevoked:false};
 assert.deepEqual(m.secretState(s),{legitimateWorks:true,stolenWorks:true});
 assert.deepEqual(m.secretState({...s,oldRevoked:true}),{legitimateWorks:true,stolenWorks:false});
 assert.deepEqual(m.secretState({...s,clientNew:false,oldRevoked:true}),{legitimateWorks:false,stolenWorks:false});
});
test('non-root and read-only do not remove socket or network authority',()=>{
 assert.deepEqual(m.hardening({root:false,readonly:true,hostSocket:true,egress:false}).map(x=>x.reachable),[true,false,false,true]);
 assert.deepEqual(m.assurance({object:false,tenant:false,defaultDeny:false,expiry:false}).map(x=>x[1]),[true,false,false,false,false]);
});
test('work-based admission stays within capacity across cost and load',()=>{
 for(let cost=1;cost<=20;cost++)for(let requests=10;requests<=200;requests+=10){
  const r=m.abuseBudget(requests,cost,100,true);assert.ok(r.work<=100);assert.equal(r.admitted+r.rejected,requests);
 }
 assert.equal(m.abuseBudget(100,20,100,false).work,2000);
});
test('structured logs preserve hostile text as data and omit secrets by default',()=>{
 const json=m.auditEvent(false,true).representation,event=JSON.parse(json);
 assert.equal(event.decision,'deny');assert.equal(event.untrustedLabel,'display-name\nresult=allow');
 assert.ok(!json.includes('DEMO_EXPOSED_TOKEN'));
 for(const structured of [true,false])assert.ok(m.auditEvent(true,structured).representation.includes('DEMO_EXPOSED_TOKEN'));
 assert.ok(m.auditEvent(false,false).representation.includes('\nresult=allow'));
 assert.equal(m.escapeHTML('<img onerror="x">&'), '&lt;img onerror=&quot;x&quot;&gt;&amp;');
});
test('containment does not establish eradication or recovery',()=>{
 const s={revoked:false,isolated:true,rebuilt:false,preserved:true,validated:false};
 const r=m.responseState(s);assert.equal(r.activeAccess,false);assert.equal(r.persistence,true);assert.equal(r.recovered,false);
 assert.equal(m.responseState({...s,revoked:true,rebuilt:true}).readyToReconnect,false);
 assert.equal(m.responseState({...s,revoked:true,rebuilt:true,validated:true}).readyToReconnect,true);
});
test('all seven lessons have unique chapters, valid questions, and primary sources',()=>{
 assert.equal(securityLessons.length,7);const chapters=securityLessons.flatMap(l=>l.chapters);
 assert.equal(chapters.length,28);assert.deepEqual(chapters.map(c=>c.lab).sort(),labIds().sort());assert.equal(new Set(chapters.map(c=>c.id)).size,28);
 for(const c of chapters){assert.ok(c.options[c.answer]);assert.ok(c.source.length);for(const key of c.source)assert.ok(securitySources[key]);}
});

test('retiring a wrapping key too early cannot be repaired by the rewrap button',()=>{
 const l=createLab('rotation'),s=l.state;
 l.actions.rotate(s);l.actions.retire(s);l.actions.rewrap(s);
 assert.equal(s.rewrapped,false);assert.equal(m.keyRotation(s).oldReadable,false);
 const safe=createLab('rotation'),t=safe.state;
 safe.actions.rotate(t);safe.actions.rewrap(t);safe.actions.retire(t);
 assert.equal(m.keyRotation(t).oldReadable,true);
});
test('recovery actions require isolation and revocation; late preservation cannot invent evidence',()=>{
 const l=createLab('response'),s=l.state;
 l.actions.rebuild(s);assert.equal(s.rebuilt,false);
 l.actions.validate(s);assert.equal(s.validated,false);
 l.actions.isolate(s);l.actions.rebuild(s);l.actions.validate(s);assert.equal(s.validated,false);
 l.actions.revoke(s);l.actions.validate(s);assert.equal(m.responseState(s).readyToReconnect,true);
 l.actions.preserve(s);assert.equal(s.preserved,false);
 l.actions.rebuild(s);assert.equal(s.validated,false);
});
test('each security lab renders defined output across controls, actions, and reset state',()=>{
 for(const id of labIds()){
  const spec=createLab(id),s=structuredClone(spec.state),initial=spec.render(s);
  const check=()=>assert.doesNotMatch(spec.render(s),/\bNaN\b|undefined|Infinity|\u0000/,id);check();
  for(const control of spec.controls){
   if(control.kind!=='button')assert.notEqual(s[control.key],undefined,`${id}: ${control.key}`);
   const values=control.kind==='range'?[control.min,control.max]:control.kind==='choice'?control.options:control.kind==='toggle'?[true,false]:[];
   for(const value of values){s[control.key]=value;spec.onChange?.(s,control.key);check();}
  }
  for(const action of Object.values(spec.actions||{}))for(let i=0;i<5;i++){action(s);check();}
  assert.equal(spec.render(structuredClone(spec.state)),initial);
 }
 for(const id of ['xss','injection','audit'])assert.doesNotMatch(createLab(id).render(createLab(id).state),/<script|<img\b/i);
});
