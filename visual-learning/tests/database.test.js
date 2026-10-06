import test from 'node:test';
import assert from 'node:assert/strict';
import {newPage,pageInsert,pageDelete,pageCompact,bufferAccess,layoutCost,encoding,newTree,treeInsert,treeSearch,treeLeaves,composite,lsmPut,lsmFlush,lsmRead,bloom,accessPlan,joinCost,externalSort,pagination,visibleVersion,writeSkew,reservation,redoPage,checkpointStep,pitr,vacuumVersions,compactRuns,partitionScan} from '../dist/assets/database-models.js';
import {databaseLessons,databaseSources} from '../dist/assets/database-curriculum.js';
import {createLab,labIds} from '../dist/assets/database-labs.js';

test('database curriculum maps every chapter to an experiment, source, and answer',()=>{
 const chapters=databaseLessons.flatMap(l=>l.chapters);
 assert.equal(chapters.length,24);assert.equal(new Set(chapters.map(c=>c.id)).size,24);
 assert.deepEqual(chapters.map(c=>c.lab).sort(),labIds().sort());
 for(const c of chapters){assert.ok(c.options[c.answer]);assert.equal(new Set(c.options).size,c.options.length);for(const ref of c.source)assert.ok(databaseSources[ref]);}
});

test('slotted-page insertion never overlaps metadata or payload; compaction preserves slots',()=>{
 let p=newPage();
 for(let i=0;i<60;i++){
  const before=structuredClone(p);p=i%7===0?pageCompact(p):i%3===0?pageDelete(p):pageInsert(p,(i%6+1)*8);
  const lower=16+2*p.slots.length;
  assert.ok(p.upper>=lower);
  const occupied=new Set(Array.from({length:lower},(_,j)=>j));
  for(const r of p.slots)for(let j=r.offset;j<r.offset+r.size;j++){assert.ok(j>=lower&&j<256);assert.ok(!occupied.has(j));occupied.add(j);}
  assert.equal(occupied.size+(p.upper-lower),256);
  if(i%7===0)assert.deepEqual(p.slots.filter(r=>r.live).map(r=>[r.id,r.size]),before.slots.filter(r=>r.live).map(r=>[r.id,r.size]));
 }
});

test('dirty eviction writes once while clean hits avoid storage reads',()=>{
 let s={frames:[],hits:0,reads:0,writes:0,accesses:0};
 s=bufferAccess(s,'A',true);s=bufferAccess(s,'B');s=bufferAccess(s,'C');s=bufferAccess(s,'B');
 assert.equal(s.hits,1);assert.equal(s.reads,3);
 s=bufferAccess(s,'D');assert.equal(s.writes,1);assert.deepEqual(s.frames.map(f=>f.page),['C','B','D']);
});

test('column projection saves scan pages and encoding preserves the original values',()=>{
 assert.ok(layoutCost(10000,8,1).columnPages<layoutCost(10000,8,1).rowPages);
 for(let distinct=1;distinct<=8;distinct++){
  const a=encoding('Clustered',distinct),b=encoding('Interleaved',distinct);
  assert.deepEqual([...a.values].sort(),[...b.values].sort());
  for(const e of [a,b])assert.deepEqual(e.runs.flatMap(r=>Array(r.count).fill(r.value)),e.values);
  assert.ok(a.runs.length<=b.runs.length);assert.equal(a.dictionary,b.dictionary);
 }
});

function validateTree(tree,expected){
 const depths=[],leafKeys=[];
 function visit(node,depth,isRoot=false){
  assert.ok(node.keys.length<=3);assert.deepEqual(node.keys,[...node.keys].sort((a,b)=>a-b));
  if(node.leaf){depths.push(depth);leafKeys.push(...node.keys);return node.keys;}
  assert.equal(node.children.length,node.keys.length+1);assert.ok(node.children.length>=2);
  const sub=node.children.map(child=>visit(child,depth+1));
  assert.deepEqual(node.keys,sub.slice(1).map(keys=>keys[0]));
  for(let i=1;i<sub.length;i++)assert.ok(sub[i-1].at(-1)<sub[i][0]);
  return sub.flat();
 }
 visit(tree,0,true);assert.equal(new Set(depths).size,1);
 assert.deepEqual(leafKeys,[...expected].sort((a,b)=>a-b));
 for(const key of expected)assert.equal(treeSearch(tree,key).found,true);
 assert.equal(treeSearch(tree,-1).found,false);
}
test('B+ tree splits preserve sorted leaves, exact separators, and equal leaf depth',()=>{
 const keys=Array.from({length:48},(_,i)=>i+1);
 for(const order of [keys,[...keys].reverse(),[...keys].sort((a,b)=>(a*19%53)-(b*19%53))]){
  let tree=newTree();const inserted=new Set();
  for(const key of order){tree=treeInsert(tree,key);inserted.add(key);validateTree(tree,inserted);}
  const before=structuredClone(tree);tree=treeInsert(tree,20);assert.deepEqual(tree,before);
  assert.equal(treeLeaves(tree).flatMap(n=>n.keys).length,48);
 }
});

test('composite orders return the same rows but visit different intervals',()=>{
 for(let tenant=1;tenant<=3;tenant++)for(let day=1;day<=8;day++){
  const a=composite('Tenant, day',tenant,day),b=composite('Day, tenant',tenant,day);
  assert.deepEqual(a.result,b.result);assert.equal(a.scanned.length,9-day);assert.equal(b.scanned.length,3*(9-day));
 }
});

test('LSM reads stop at the newest version or tombstone across flushes',()=>{
 let s={seq:0,mem:[],runs:[]};s=lsmPut(s,'A',1);s=lsmFlush(s);s=lsmPut(s,'A',2);s=lsmFlush(s);
 assert.equal(lsmRead(s,'A').value,2);
 s=lsmPut(s,'A',null);assert.equal(lsmRead(s,'A').found,false);
 s=lsmFlush(s);assert.equal(lsmRead(s,'A').found,false);assert.equal(lsmRead(s,'Z').found,false);
 assert.equal(s.runs[2][0].value,1);
});

test('Bloom filters never reject an inserted key for any available configuration',()=>{
 for(const bits of [16,32,64,128])for(let k=1;k<=5;k++)for(let n=1;n<=12;n++){
  const keys=Array.from({length:n},(_,i)=>i+1);
  for(const key of keys)assert.equal(bloom(keys,bits,k,key).maybe,true);
 }
 const keys=[1,2,3,4,5];assert.ok(Array.from({length:195},(_,i)=>i+6).some(q=>bloom(keys,16,3,q).maybe));
});

test('corrected cardinality changes the plan when random lookups become costly',()=>{
 const stale=accessPlan(1,50,4),fresh=accessPlan(50,50,4);
 assert.equal(stale.choice,'Index scan');assert.equal(fresh.choice,'Sequential scan');assert.ok(fresh.actualCost<stale.actualCost);
 assert.equal(stale.estimatedIndex,403);assert.equal(stale.actualIndex,20003);
});

test('indexed nested loops can win for tiny outer input; unsorted merge pays sort cost',()=>{
 const tiny=joinCost(1,10000,true,false);assert.ok(tiny.nested<tiny.hash);
 const large=joinCost(1000,1000,false,false);assert.ok(large.hash<large.nested);
 assert.ok(large.merge>joinCost(1000,1000,false,true).merge);
});

test('external sort has no spill when it fits and counts intermediate merge traffic',()=>{
 assert.equal(externalSort(1000,1000).tempRowTransfers,0);
 const r=externalSort(10000,1000);assert.deepEqual(r.levels,[10,3,1]);assert.equal(r.tempRowTransfers,40000);
 for(let memory=500;memory<=10000;memory+=500)assert.ok(externalSort(10000,memory).tempRowTransfers>=externalSort(10000,memory+500).tempRowTransfers);
});

test('keyset pagination avoids the duplicate positions introduced by new arrivals',()=>{
 assert.deepEqual(pagination(true,'Offset').duplicates,[97,96]);assert.deepEqual(pagination(true,'Keyset').duplicates,[]);
 assert.deepEqual(pagination(true,'Keyset').second,[95,94,93,92,91]);
 assert.deepEqual(pagination(false,'Offset').second,pagination(false,'Keyset').second);
});

test('snapshots exclude future commits and serializable toy rejects write skew',()=>{
 const versions=[{commit:10,value:100},{commit:20,value:110}];
 assert.equal(visibleVersion(versions,15).value,100);assert.equal(visibleVersion(versions,20).value,110);
 assert.equal(writeSkew(false,4).a||writeSkew(false,4).b,false);
 assert.equal(writeSkew(true,4).b,true);assert.equal(writeSkew(true,4).aborted,true);
});

test('a row lock persists until the transaction ends and releases its waiter',()=>{
 const l=createLab('locks'),s=l.state;l.actions.a(s);l.actions.b(s);l.actions.wait(s);
 assert.equal(s.b,'waiting');assert.equal(s.wait,1);l.actions.end(s);assert.equal(s.b,'done');
});

test('unique enforcement arbitrates either insertion order after stale availability checks',()=>{
 for(const order of [['A','B'],['B','A']]){
  let safe={rows:[],done:[],rejected:[]},unsafe=structuredClone(safe);
  for(const client of order){safe=reservation(safe,client,true);unsafe=reservation(unsafe,client,false);}
  assert.equal(safe.rows.length,1);assert.equal(safe.rejected.length,1);assert.equal(unsafe.rows.length,2);
 }
});

test('WAL ordering rejects early page flush and a crash stops all later progress',()=>{
 const l=createLab('wal'),s=l.state;l.actions.step(s);l.actions.page(s);assert.equal(s.page,false);
 l.actions.step(s);l.actions.page(s);assert.equal(s.page,true);
 l.actions.crash(s);const crashed=structuredClone(s);l.actions.step(s);l.actions.page(s);assert.deepEqual(s,crashed);
});

test('checkpoint accounting never advances beyond durable updates and coalesces hot writes',()=>{
 const run=interval=>{let s={interval,time:0,dirty:Array(6).fill(false),log:0,checkpoint:0,writes:0,count:0};for(let i=0;i<24;i++){s=checkpointStep(s);assert.ok(s.checkpoint<=s.log);}return s;};
 assert.equal(run(2).writes,24);assert.equal(run(12).writes,12);assert.equal(run(12).log,24);assert.equal(run(12).checkpoint,24);
});

test('redo is idempotent, respects durability, and keeps the page LSN with its value',()=>{
 const records=[{lsn:1,value:110},{lsn:2,value:120},{lsn:3,value:90}];
 for(let durable=1;durable<=3;durable++)for(let disk=0;disk<=durable;disk++){
  const page={lsn:disk,value:disk?records[disk-1].value:100},first=redoPage(page,records,durable),second=redoPage(first.page,records,durable);
  assert.equal(first.page.value,records[durable-1].value);assert.equal(first.page.lsn,durable);
  assert.deepEqual(second.page,first.page);assert.equal(second.applied,0);assert.equal(first.applied,durable-disk);
 }
});

test('PITR needs an unbroken prefix and can stop before a bad committed update',()=>{
 assert.equal(pitr(2,0).value,130);assert.equal(pitr(3,0).value,0);
 assert.equal(pitr(2,3).reachable,true);assert.equal(pitr(3,2).reachable,false);assert.equal(pitr(0,1).value,100);
});

test('vacuum retains every version a supported snapshot can still see',()=>{
 for(let oldest=10;oldest<=50;oldest+=5){
  for(const v of vacuumVersions(oldest))if(v.reclaimable)for(let snapshot=oldest;snapshot<=60;snapshot++)assert.ok(!(snapshot>=v.born&&snapshot<v.replaced));
 }
 assert.equal(vacuumVersions(15).filter(v=>v.reclaimable).length,0);
 assert.equal(vacuumVersions(40).filter(v=>v.reclaimable).length,3);
});

test('dropping tombstones is unsafe with unmerged older values but safe after full coverage',()=>{
 const runs=[[{key:'A',value:null,seq:3}],[{key:'A',value:2,seq:2}],[{key:'A',value:1,seq:1}]];
 const unsafe=compactRuns(runs.slice(0,2),true),safe=compactRuns(runs.slice(0,2),false);
 assert.equal(lsmRead({mem:[],runs:[unsafe,runs[2]]},'A').value,1);
 assert.equal(lsmRead({mem:[],runs:[safe,runs[2]]},'A').found,false);
 assert.equal(lsmRead({mem:[],runs:[compactRuns(runs,true)]},'A').found,false);
});

test('partition pruning excludes exactly the months outside the inclusive interval',()=>{
 for(let start=1;start<=12;start++)for(let end=start;end<=12;end++){
  assert.equal(partitionScan(start,end,true).filter(p=>p.read).length,end-start+1);
  assert.equal(partitionScan(start,end,false).filter(p=>p.read).length,12);
 }
});

test('every lab initializes its controls and renders defined results across inputs and actions',()=>{
 for(const id of labIds()){
  const spec=createLab(id),s=structuredClone(spec.state);
  const check=()=>{const html=spec.render(s);assert.ok(html.length>100,id);assert.doesNotMatch(html,/\bNaN\b|undefined|Infinity|\u0000/,id);};check();
  for(const control of spec.controls){
   if(control.kind!=='button')assert.notEqual(s[control.key],undefined,`${id}: ${control.key} initialized`);
   const values=control.kind==='range'?[control.min,control.max]:control.kind==='choice'?control.options:control.kind==='toggle'?[true,false]:[];
   for(const value of values){s[control.key]=value;spec.onChange?.(s,control.key);check();}
  }
  for(const action of Object.values(spec.actions||{}))for(let i=0;i<26;i++){action(s);check();}
 }
});
