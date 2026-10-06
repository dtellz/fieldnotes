import test from 'node:test';
import assert from 'node:assert/strict';
import {majority,queueModel,tailProbability,quorum,placement,bucketStep,burnRate,estimate,vectorRelation,applyDelivery,recovery} from '../dist/assets/systems-models.js';
import {systemsLessons,sources} from '../dist/assets/systems-curriculum.js';
import {labIds,createLab} from '../dist/assets/systems-labs.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('every chapter has a working experiment, source, and unambiguous answer',()=>{
 const ids=systemsLessons.flatMap(l=>l.chapters.map(c=>c.id));assert.equal(new Set(ids).size,ids.length);
 for(const l of systemsLessons)for(const c of l.chapters){assert.ok(labIds().includes(c.lab));assert.ok(c.options[c.answer]);for(const ref of c.source)assert.ok(sources[ref]);assert.ok(createLab(c.lab).render(createLab(c.lab).state).length>100);}
});
test('quorum arithmetic agrees with exhaustive fixed-membership intersections',()=>{
 for(let n=1;n<=6;n++)for(let r=1;r<=n;r++)for(let w=1;w<=n;w++){
  const sets=Array.from({length:1<<n},(_,x)=>x),bits=x=>x.toString(2).replaceAll('0','').length;
  const every=sets.filter(x=>bits(x)===r).every(a=>sets.filter(x=>bits(x)===w).every(b=>(a&b)!==0));
  assert.equal(quorum(n,r,w).overlap,every);
 }
});
test('M/M/1 obeys Little’s Law and has no stable state at capacity',()=>{
 const a=queueModel(70,100),b=queueModel(95,100);close(a.inflight,70*a.time);assert.ok(b.time>a.time);assert.equal(queueModel(100,100).stable,false);assert.equal(queueModel(110,100).time,Infinity);
});
test('independent fan-out increases probability of at least one slow response',()=>{
 close(tailProbability(.01,1),.01);assert.ok(tailProbability(.01,100)>.63);close(tailProbability(0,100),0);
});
test('adding a rendezvous node moves keys only to that new node',()=>{
 for(let n=2;n<8;n++)for(let k=0;k<500;k++){const old=placement(`key-${k}`,n),next=placement(`key-${k}`,n+1);assert.ok(next===old||next===n);}
});
test('deduplicated replay applies an effect once; unsafe replay applies it repeatedly',()=>{
 let safe={total:0,seen:[]},unsafe={total:0,seen:[]};for(let i=0;i<10;i++){safe=applyDelivery(safe,'a',10,true);unsafe=applyDelivery(unsafe,'a',10,false);}assert.equal(safe.total,10);assert.equal(unsafe.total,100);assert.equal(applyDelivery(safe,'b',10,true).total,20);
});
test('a token bucket conserves tokens and admits no more than its burst plus refill',()=>{
 let tokens=50,accepted=0;for(let i=0;i<100;i++){const r=bucketStep(tokens,50,10,30);assert.ok(r.tokens>=0&&r.tokens<=50);assert.equal(r.accepted+r.rejected,30);tokens=r.tokens;accepted+=r.accepted;}assert.ok(accepted<=50+100*10);
});
test('vector versions distinguish causality from concurrency',()=>{
 assert.equal(vectorRelation([2,0],[2,1]),'before');assert.equal(vectorRelation([2,0],[0,2]),'concurrent');assert.equal(vectorRelation([2,1],[2,1]),'equal');
});
test('SLO burn and storage sizing use consistent denominators',()=>{
 const b=burnRate(99.9,1,60);close(b.rate,10);close(b.spent,10*60/43200*100);
 const e=estimate(1e6,10,20,1000,5,30);close(e.storage,300e9);close(e.writes,1e7/86400);
});
test('a committed entry stays committed after losing quorum',()=>{
 const l=createLab('consensus'),s=l.state;l.actions.append(s);assert.equal(s.committed,true);s.reachable=1;l.onChange(s,'reachable');assert.equal(s.committed,true);assert.equal(majority(5),3);
});
test('a minority cannot elect a new leader in the consensus illustration',()=>{
 const l=createLab('consensus'),s=l.state;s.reachable=2;l.actions.term(s);assert.equal(s.term,7);assert.equal(s.electionBlocked,true);s.reachable=3;l.actions.term(s);assert.equal(s.term,8);assert.equal(s.electionBlocked,false);
});
test('a follower does not forget replicated state after a new partition',()=>{
 const l=createLab('partitions'),s=l.state;l.actions.write(s);assert.equal(s.replica,0);s.split=false;l.onChange(s,'split');assert.equal(s.replica,1);s.split=true;l.onChange(s,'split');assert.equal(s.replica,1);
});
test('recovery distinguishes base-backup loss from archived-log loss',()=>{
 const s={backupAge:240,logLag:5,restoreMinutes:45,replayMinutes:15,pitr:true};assert.deepEqual(recovery(s),{rpo:5,rto:60});assert.deepEqual(recovery({...s,pitr:false}),{rpo:240,rto:45});
});
