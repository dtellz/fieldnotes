import test from 'node:test';
import assert from 'node:assert/strict';
import {integer8,pipeline,branches,parallelTime,matrixAccess,cacheTrace,sharing,roofline,schedule,translation,memoryBudget,raceStep,lockStep,batchCost,eventLoop,tcpThroughput,percentile,latencySample,benchmark} from '../dist/assets/computer-models.js';
import {computerLessons,computerSources} from '../dist/assets/computer-curriculum.js';
import {labIds,createLab} from '../dist/assets/computer-labs.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('computer curriculum covers all experiments with valid sources and questions',()=>{
  const chapters=computerLessons.flatMap(l=>l.chapters);
  assert.equal(chapters.length,24);
  assert.deepEqual(chapters.map(c=>c.lab).sort(),labIds().sort());
  assert.equal(new Set(chapters.map(c=>c.id)).size,24);
  for(const c of chapters){
    assert.ok(c.options[c.answer]);assert.equal(new Set(c.options).size,c.options.length);
    for(const source of c.source)assert.ok(computerSources[source]);
  }
});

test('8-bit wrap and two’s-complement interpretation agree for every byte',()=>{
  for(let value=0;value<256;value++)for(let add=0;add<=32;add++){
    const r=integer8(value,add);
    assert.equal(parseInt(r.bits,2),r.unsigned);assert.equal(r.bits.length,8);
    assert.equal((r.signed+256)%256,r.unsigned);
    assert.ok(r.signed>=-128&&r.signed<=127);
  }
  assert.equal(integer8(127,1).signed,-128);assert.equal(integer8(255,1).unsigned,0);
});

test('pipeline respects dependency completion and per-cycle issue capacity',()=>{
  for(let chains=1;chains<=6;chains++)for(let width=1;width<=4;width++)for(let latency=1;latency<=6;latency++){
    const r=pipeline(chains,width,latency),last=Array(chains).fill(0),issues=new Map();
    for(const i of r.instructions){
      assert.ok(i.start>=last[i.chain]);last[i.chain]=i.end;
      issues.set(i.start,(issues.get(i.start)||0)+1);assert.ok(issues.get(i.start)<=width);
      assert.equal(i.end-i.start,latency);
    }
    assert.equal(r.instructions.length,12);assert.equal(r.cycles,Math.max(...last));
  }
  assert.equal(pipeline(1,1).cycles,pipeline(1,4).cycles);
});

test('branch predictor learns steady outcomes and never leaves its four states',()=>{
  assert.equal(branches('Steady').filter(b=>b.miss).length,1);
  for(const p of ['Steady','Alternating','Clustered','Irregular'])for(const b of branches(p))assert.ok(b.after>=0&&b.after<=3);
});

test('parallelism respects the serial limit and includes coordination overhead',()=>{
  close(parallelTime(.5,1,5).total,100);
  assert.ok(parallelTime(.5,32,0).speedup<2);
  assert.ok(parallelTime(.8,32,5).total>parallelTime(.8,4,5).total);
});

test('traversals visit every value once and tiling reuses lines before eviction',()=>{
  for(const order of ['Rows','Columns','Tiled'])assert.deepEqual([...matrixAccess(order)].sort((a,b)=>a-b),Array.from({length:64},(_,i)=>i));
  const misses=order=>cacheTrace(matrixAccess(order),4).filter(x=>!x.hit).length;
  assert.equal(misses('Rows'),16);assert.equal(misses('Columns'),64);assert.equal(misses('Tiled'),16);
  assert.equal(cacheTrace(matrixAccess('Columns'),16).filter(x=>!x.hit).length,16);
});

test('padding removes alternating ownership transfers between independent counters',()=>{
  assert.equal(sharing(false,16).transfers,15);assert.equal(sharing(true,16).transfers,0);
  assert.equal(sharing(false,0).transfers,0);
});

test('roofline obeys both limits and is continuous at its ridge',()=>{
  for(const intensity of [.5,1,2,4,8,16,32]){
    const r=roofline(intensity,50,800);assert.ok(r.attainable<=800&&r.attainable<=intensity*50);
  }
  close(roofline(16,50,800).attainable,800);
});

test('GC reclaims unreachable memory but preserves retained objects',()=>{
  const lab=createLab('allocation'),s=lab.state;
  lab.actions.allocate(s);lab.actions.allocate(s);assert.equal(s.live,20);
  lab.actions.collect(s);assert.equal(s.live,20);assert.equal(s.garbage,0);
  lab.actions.release(s);assert.equal(s.live,0);assert.equal(s.garbage,20);
  lab.actions.collect(s);assert.equal(s.garbage,0);assert.equal(s.allocated,80);
});

test('scheduler conserves service demand and accounts for every switch',()=>{
  for(const policy of ['FIFO','Shortest first','Round robin'])for(let quantum=1;quantum<=6;quantum++){
    const r=schedule(policy,quantum,1);
    for(let j=0;j<3;j++)assert.equal(r.segments.filter(s=>s.job===j).reduce((n,s)=>n+s.duration,0),[12,3,3][j]);
    assert.equal(r.time,18+r.overhead);assert.equal(r.time,Math.max(...r.ends));
    for(let i=1;i<r.segments.length;i++)assert.equal(r.segments[i].start,r.segments[i-1].start+r.segments[i-1].duration);
  }
  assert.ok(schedule('Round robin',1).starts[1]<schedule('FIFO',1).starts[1]);
  assert.ok(schedule('Round robin',1).overhead>schedule('Round robin',6).overhead);
});

test('translation preserves offsets across page boundaries',()=>{
  for(const addr of [0,4095,4096,8191,8192,12288,16383]){
    const r=translation(addr);assert.equal(r.physical%4096,addr%4096);assert.equal(r.vpn*4096+r.offset,addr);
  }
});

test('reclaim cannot free live heap or native memory to fake a fitting budget',()=>{
  assert.deepEqual(memoryBudget(384,128,128,512),{total:640,reclaim:128,after:512,excess:0});
  assert.equal(memoryBudget(512,128,128,512).excess,128);
});

test('enumerating all two-increment interleavings exposes lost updates',()=>{
  const permutations=(a,b,p=[])=>a===0&&b===0?[p]:[...(a?permutations(a-1,b,[...p,'A']):[]),...(b?permutations(a,b-1,[...p,'B']):[])];
  const outcomes=new Set();
  for(const order of permutations(2,2)){
    let plain={value:0,pc:{A:0,B:0},local:{A:null,B:null},log:[]},atomic=structuredClone(plain);
    for(const t of order){plain=raceStep(plain,t,false);atomic=raceStep(atomic,t,true);}
    outcomes.add(plain.value);assert.equal(atomic.value,2);
  }
  assert.deepEqual([...outcomes].sort(),[1,2]);
});

test('opposite lock orders deadlock; common ordering lets a holder finish',()=>{
  const initial=()=>({pc:{A:0,B:0},owners:{X:null,Y:null}});
  let s=initial();for(const t of ['A','B','A','B'])s=lockStep(s,t,false);
  assert.deepEqual(s.pc,{A:1,B:1});const dead=structuredClone(s);
  for(const t of ['A','B','A','B'])s=lockStep(s,t,false);assert.deepEqual(s,dead);
  s=initial();for(const t of ['B','A','B','B','A','A','A'])s=lockStep(s,t,true);
  assert.deepEqual(s.pc,{A:3,B:3});assert.deepEqual(s.owners,{X:null,Y:null});
});

test('cancellation cleanup releases ownership without undoing a sent write',()=>{
  const l=createLab('lifetime'),s=l.state;
  l.actions.tick(s);l.actions.timeout(s);assert.equal(s.done,false);
  l.actions.tick(s);assert.equal(s.done,true);assert.equal(s.cancelled,true);assert.equal(s.ticks,1);
});

test('batches reduce fixed overhead but increase the first record’s fill wait',()=>{
  const a=batchCost(1,1000),b=batchCost(64,1000);
  assert.equal(a.copying,b.copying);assert.ok(b.total<a.total);assert.ok(b.fill>a.fill);
  assert.equal(b.calls,16);assert.equal(b.fill,63);
});

test('a power cut freezes the durability experiment until reset',()=>{
  const l=createLab('durability'),s=l.state;l.actions.step(s);l.actions.crash(s);
  l.actions.step(s);assert.equal(s.stage,1);assert.equal(s.failed,true);
});

test('async I/O frees waiting time but cannot preempt the CPU phase',()=>{
  assert.equal(eventLoop(true,2).bLatency,39);assert.equal(eventLoop(false,2).bLatency,2);
  assert.equal(eventLoop(false,100).bLatency,97);
});

test('TCP window bound uses bytes/bits correctly and scales inversely with RTT',()=>{
  close(tcpThroughput(64,50,1000).throughput,10.48576);
  close(tcpThroughput(64,100,1000).throughput,tcpThroughput(64,50,1000).throughput/2);
  assert.equal(tcpThroughput(1024,5,10).throughput,10);
});

test('nearest-rank p99 distinguishes one and two slow samples in one hundred',()=>{
  assert.equal(percentile(latencySample(1,1000),.99),10);
  assert.equal(percentile(latencySample(2,1000),.99),1000);
  assert.equal(percentile(latencySample(1,1000),1),1000);
});

test('benchmark confounders can reverse a true A/B ordering',()=>{
  const mean=(runs,v)=>runs.filter(r=>r.version===v).reduce((n,r)=>n+r.ms,0)/5;
  const grouped=benchmark('Grouped',true,true),interleaved=benchmark('Interleaved',true,true);
  assert.ok(mean(grouped,'B')>mean(grouped,'A'));
  assert.ok(mean(interleaved,'B')<mean(interleaved,'A'));
  assert.ok(benchmark('Grouped',false,false).every(r=>r.ms===.1));
});

test('all controls and bounded action sequences render finite, defined output',()=>{
  for(const id of labIds()){
    const spec=createLab(id),s=structuredClone(spec.state);
    const check=()=>{const html=spec.render(s);assert.ok(html.length>100,id);assert.doesNotMatch(html,/\bNaN\b|undefined|Infinity|\u0000/,id);};
    check();
    for(const control of spec.controls){
      const values=control.kind==='range'?[control.min,control.max]:control.kind==='choice'?control.options:control.kind==='toggle'?[true,false]:[];
      for(const value of values){s[control.key]=value;spec.onChange?.(s,control.key);check();}
    }
    for(const action of Object.values(spec.actions||{}))for(let i=0;i<30;i++){action(s);check();}
  }
});
