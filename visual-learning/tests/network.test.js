import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../dist/assets/network-models.js';
import {networkLessons,networkSources} from '../dist/assets/network-curriculum.js';
import {createLab,labIds} from '../dist/assets/network-labs.js';

test('networking registry covers seven lessons and every experiment exactly once',()=>{
 const chapters=networkLessons.flatMap(l=>l.chapters);
 assert.equal(networkLessons.length,7);assert.equal(chapters.length,28);
 assert.equal(new Set(chapters.map(c=>c.id)).size,28);
 assert.deepEqual(chapters.map(c=>c.lab).sort(),labIds().sort());
 for(const c of chapters){assert.ok(c.options[c.answer]);for(const key of c.source)assert.ok(networkSources[key]);}
});
test('routed packet changes link envelope and hop budget without rewriting endpoints',()=>{
 for(let size=100;size<=1400;size+=100){const p=m.packet(size,0),q=m.packet(size,2);
  assert.equal(p.frame,size+58);assert.equal(p.ip,size+40);assert.equal(p.tcp,size+20);
  assert.equal(p.source,q.source);assert.equal(p.destination,q.destination);assert.notEqual(p.link,q.link);assert.equal(q.ttl,p.ttl-2);
 }
});
test('longest prefix wins independent of table order and falls back to covering routes',()=>{
 assert.equal(m.routeFor('10.42.7.19').prefix,'10.42.7.0/24');
 assert.equal(m.routeFor('10.42.7.19',false).prefix,'10.42.0.0/16');
 assert.equal(m.routeFor('10.42.8.19').prefix,'10.42.0.0/16');
 assert.equal(m.routeFor('10.99.1.2').prefix,'10.0.0.0/8');
 assert.equal(m.routeFor('198.51.100.20').prefix,'0.0.0.0/0');
 assert.equal(m.routeFor('10.42.7.255').prefix,'10.42.7.0/24');
});
test('DNS publication does not invalidate a live entry and expiry triggers refresh',()=>{
 const s={ttl:60,now:59,cache:{address:'old',expires:60},authority:'new',lookups:0};
 const hit=m.dnsLookup(s);assert.equal(hit.answer,'old');assert.equal(hit.cache.expires,60);
 const miss=m.dnsLookup({...s,now:60});assert.equal(miss.answer,'new');assert.equal(miss.cache.expires,120);assert.equal(miss.hit,false);
 assert.equal(m.dnsLookup({...s,cache:null}).answer,'new');
});
test('MTU includes headers, accepts an exact fit, and packetizes within every link',()=>{
 assert.equal(m.mtuModel(1232,1280,false,false).delivered,true);
 assert.equal(m.mtuModel(1233,1280,false,false).delivered,false);
 assert.equal(m.mtuModel(1400,1500,true,false).mtu,1420);
 for(let payload=100;payload<=1600;payload+=100){const r=m.mtuModel(payload,1280,true,true);assert.ok(r.size<=r.mtu);assert.ok(r.chunks*r.maxPayload>=payload);assert.ok((r.chunks-1)*r.maxPayload<payload);}
});
test('TCP exposes only a contiguous prefix; UDP preserves arrived datagram order',()=>{
 const arrived=[1,3,4,5,6];const tcp=m.delivery(arrived,'TCP');
 assert.deepEqual(tcp.visible,[1]);assert.deepEqual(tcp.buffered,[3,4,5,6]);assert.equal(tcp.ack,101);
 assert.deepEqual(m.delivery(arrived,'UDP').visible,arrived);
 assert.deepEqual(m.delivery([...arrived,2],'TCP').visible,[1,2,3,4,5,6]);
 assert.equal(m.delivery([...arrived,2,2],'TCP').ack,601);
});
test('both windows and already outstanding bytes bound new sends',()=>{
 for(let cwnd=1;cwnd<=20;cwnd++)for(let rwnd=0;rwnd<=20;rwnd++)for(let inflight=0;inflight<=20;inflight++){
  const credit=m.sendBudget(cwnd,rwnd,inflight);assert.ok(credit>=0);
  if(credit>0)assert.ok(inflight+credit<=cwnd&&inflight+credit<=rwnd);
 }
 assert.equal(m.sendBudget(10,6,4),2);assert.equal(m.sendBudget(10,0,4),0);
});
test('congestion sketch changes from growth to additive probing and backoff',()=>{
 let s={cwnd:1,threshold:8,history:[1],round:0};
 for(const value of [2,4,8,9,10]){s=m.congestionStep(s);assert.equal(s.cwnd,value);}
 s=m.congestionStep(s,true);assert.equal(s.cwnd,5);assert.equal(s.threshold,5);
 s=m.congestionStep(s);assert.equal(s.cwnd,6);
 for(let i=0;i<30;i++){const before=s.cwnd;s=m.congestionStep(s,true);assert.ok(s.cwnd<=before);}assert.ok(s.cwnd>=1);assert.ok(s.history.length<=16);
});
test('reuse removes setup rounds but never the request propagation round',()=>{
 assert.equal(m.connectionLoad(8,true,50).opens,1);assert.equal(m.connectionLoad(8,false,50).handshakeMs,400);
 assert.equal(m.handshake('HTTP/2',false,50).firstByte,150);
 assert.equal(m.handshake('HTTP/3',false,50).firstByte,100);
 for(const protocol of ['HTTP/2','HTTP/3'])assert.equal(m.handshake(protocol,true,50).firstByte,50);
});
test('QUIC avoids cross-stream ordering dependency but preserves in-stream ordering',()=>{
 const tcp=m.multiplex('HTTP/2',1,false),quic=m.multiplex('HTTP/3',1,false);
 assert.equal(tcp.filter(p=>p.ready).length,0);
 assert.equal(quic.filter(p=>p.stream==='B'&&p.ready).length,3);
 assert.equal(quic.filter(p=>p.stream==='A'&&p.ready).length,0);
 for(let lost=1;lost<=6;lost++)for(const p of ['HTTP/2','HTTP/3'])assert.equal(m.multiplex(p,lost,true).filter(x=>x.ready).length,6);
});
test('method repetition distinguishes replacement from append and initial state',()=>{
 assert.equal(m.methodEffect('PUT',0).value,0);
 assert.equal(m.methodEffect('PUT',1).value,m.methodEffect('PUT',8).value);
 assert.equal(m.methodEffect('POST',8).value,8);assert.equal(m.methodEffect('GET',8).safe,true);
});
test('conditional reads suppress matching bodies; stale conditional writes fail',()=>{
 assert.deepEqual(m.conditional('Read',true),{status:304,body:0});
 assert.deepEqual(m.conditional('Read',false),{status:200,body:120});
 assert.equal(m.conditional('Write',false).status,412);assert.equal(m.conditional('Write',true).status,200);
});
test('trusted proxy attribution ignores caller-supplied forwarding claims',()=>{
 assert.equal(m.proxyIdentity(true,true),m.proxyIdentity(false,true));
 assert.notEqual(m.proxyIdentity(true,false),m.proxyIdentity(false,false));
});
test('assignment conserves jobs and exclusion prevents routing to the slow worker',()=>{
 for(let jobs=1;jobs<=18;jobs++)for(const policy of ['Round robin','Shortest queued work']){
  const r=m.balance(jobs,policy,false);assert.equal(r.counts.reduce((a,b)=>a+b),jobs);assert.equal(r.assignments.length,jobs);
  assert.equal(r.finish[2],r.counts[2]*4);assert.equal(m.balance(jobs,policy,true).counts[2],0);
 }
 assert.ok(m.balance(12,'Shortest queued work',false).total<m.balance(12,'Round robin',false).total);
});
test('cache reuse respects exact expiry, validation, and shared/private storage',()=>{
 const s={age:59,maxAge:60,policy:'max-age',changed:true,shared:true};
 assert.equal(m.cacheDecision(s).network,false);
 assert.equal(m.cacheDecision({...s,age:60}).action,'Revalidate → 200 + body');
 assert.equal(m.cacheDecision({...s,age:60,changed:false}).action,'Revalidate → 304');
 assert.equal(m.cacheDecision({...s,policy:'no-cache'}).stored,true);assert.equal(m.cacheDecision({...s,policy:'no-cache'}).network,true);
 assert.equal(m.cacheDecision({...s,policy:'no-store'}).stored,false);
 assert.equal(m.cacheDecision({...s,policy:'private'}).stored,false);
 assert.equal(m.cacheDecision({...s,policy:'private',shared:false}).fresh,true);
});
test('representation keys separate encodings and private blocks shared reuse',()=>{
 assert.equal(m.variant('identity',false,false,true).mismatch,true);
 assert.equal(m.variant('identity',true,false,true).mismatch,false);
 assert.notEqual(m.variant('identity',true,false,true).key,m.variant('br',true,false,true).key);
 assert.equal(m.variant('identity',false,true,true).usable,false);
});
test('origin, preflight, response access, and mixed content are separate gates',()=>{
 assert.deepEqual(m.originResult('https://app.example/other',true,false),{same:true,sent:true,readable:true});
 assert.deepEqual(m.originResult('https://api.example/data',false,false),{same:false,sent:true,readable:false});
 assert.equal(m.originResult('https://api.example/data',true,false).sent,false);
 assert.equal(m.originResult('https://api.example/data',true,true).readable,true);
 assert.equal(m.originResult('https://app.example:8443/data',false,false).same,false);
 assert.equal(m.originResult('http://app.example/data',false,true).sent,false);
});
test('rendering honors style/script dependencies without painting during script execution',()=>{
 for(const css of [20,60,240])for(const js of [20,180,240])for(const defer of [false,true]){
  const r=m.renderPath(css,js,defer);assert.ok(r.executeStart>=r.cssEnd&&r.executeStart>=r.jsEnd);
  assert.ok(r.paint>=r.domReady&&r.paint>=r.cssEnd);
  assert.ok(r.paint<r.executeStart||r.paint>=r.executeEnd);
  assert.equal(r.domReady,defer?40:r.executeEnd+20);
 }
 assert.ok(m.renderPath(20,240,true).paint<m.renderPath(20,240,false).paint);
});
test('task splitting preserves CPU work while exposing input gaps',()=>{
 for(let chunks=1;chunks<=12;chunks++){const r=m.mainThread(chunks);assert.ok(Math.abs(r.rows.reduce((sum,x)=>sum+x[2],0)-120)<1e-8);assert.ok(r.input>=25);assert.ok(r.total>=120);}
 assert.equal(m.mainThread(1).delay,95);assert.ok(m.mainThread(6).delay<95);
});
test('cache-first retains old content; network-first updates or falls back offline',()=>{
 assert.deepEqual(m.workerCache('Cache first',true,'v2','v1'),{shown:'v1',network:false,updated:'v1'});
 assert.equal(m.workerCache('Network first',true,'v2','v1').updated,'v2');
 assert.equal(m.workerCache('Network first',false,'v2','v1').shown,'v1');
 assert.equal(m.workerCache('Cache first',false,'v2',null).shown,null);
 assert.equal(m.workerCache('Cache first',true,'v2',null).shown,'v2');
});
test('303 changes this POST to GET while 307 preserves it; each hop costs a round',()=>{
 assert.equal(m.redirectResult('303','POST',3,60).method,'GET');
 assert.equal(m.redirectResult('303','POST',3,60).bodyRetained,false);
 assert.equal(m.redirectResult('307','POST',3,60).method,'POST');
 assert.equal(m.redirectResult('307','POST',3,60).extra,180);
});
test('compression and throughput calculations consistently convert bits, bytes, and milliseconds',()=>{
 assert.equal(m.compression(1000,50,8,0).raw,1000);assert.equal(m.compression(1000,50,8,0).total,500);
 assert.ok(m.compression(20,90,100,100).saved<0);
 const r=m.transfer(100,80,64,10);assert.equal(r.windowMbps,6.4);assert.equal(r.bdpKB,1000);assert.equal(r.seconds,12.5);
 assert.equal(m.transfer(1000,80,64,10).rate,r.rate);
});
test('polling never delivers before creation and streaming removes polling delay only',()=>{
 for(const interval of [1,2,5,10]){const r=m.realtime('Polling',interval);r.deliveries.forEach((t,i)=>{assert.ok(t>=m.eventTimes[i]);assert.ok(t-m.eventTimes[i]<interval);});}
 assert.equal(m.realtime('SSE',5).average,0);assert.equal(m.realtime('SSE',5).bidirectional,false);
 assert.equal(m.realtime('WebSocket',5).bidirectional,true);
});
test('backpressure conserves work and never admits negative production after an existing overflow',()=>{
 let s={produce:8,consume:2,capacity:12,backpressure:true,queue:0,produced:0,consumed:0,tick:0};
 for(let i=0;i<20;i++){s=m.queueStep(s);assert.ok(s.queue<=12);assert.equal(s.produced-s.consumed,s.queue);}
 s={...s,backpressure:false};for(let i=0;i<5;i++)s=m.queueStep(s);assert.ok(s.queue>12);
 const before=s.produced;s=m.queueStep({...s,backpressure:true});assert.equal(s.produced,before);assert.equal(s.paused,8);
 for(let i=0;i<30;i++){const before=s.produced;s=m.queueStep(s);assert.ok(s.produced>=before);assert.equal(s.produced-s.consumed,s.queue);}
 assert.ok(s.queue<=12);
});
test('waterfall stages add to completion and reuse removes exactly two RTTs',()=>{
 const s={rtt:60,dns:30,reuse:false,server:40,body:80},r=m.waterfall(s);
 assert.equal(r.total,330);assert.equal(r.ttfb,250);
 assert.equal(m.waterfall({...s,reuse:true}).total,r.total-120);
 assert.equal(r.rows.reduce((n,x)=>n+x[2],0),r.total);
});
test('idle and total deadlines detect different failures including exact boundaries',()=>{
 assert.equal(m.deadline(20,40,5,40,60,250).reason,'Completed');
 assert.equal(m.deadline(20,40,10,40,60,250).reason,'Total deadline');
 assert.equal(m.deadline(20,70,5,40,60,500).reason,'Read idle timeout');
 assert.equal(m.deadline(20,40,5,70,60,500).at,120);
 assert.equal(m.deadline(20,60,1,10,60,500).timeout,true);
 assert.equal(m.deadline(20,40,1,10,60,60).timeout,true);
 assert.equal(m.deadline(20,40,5,60,60,500).reason,'Read idle timeout');
});
test('every lab initializes controls and produces finite output across inputs and repeated actions',()=>{
 for(const id of labIds()){
  const spec=createLab(id),s=structuredClone(spec.state),initial=spec.render(s);
  const check=()=>{const html=spec.render(s);assert.ok(html.length>100,id);assert.doesNotMatch(html,/\bNaN\b|undefined|Infinity|\u0000/,id);};check();
  for(const control of spec.controls){
   if(control.kind!=='button')assert.notEqual(s[control.key],undefined,`${id}: ${control.key}`);
   const values=control.kind==='range'?[control.min,control.max]:control.kind==='choice'?control.options:control.kind==='toggle'?[true,false]:[];
   for(const value of values){s[control.key]=value;spec.onChange?.(s,control.key);check();}
  }
  for(const action of Object.values(spec.actions||{}))for(let i=0;i<20;i++){action(s);check();}
  assert.equal(spec.render(structuredClone(spec.state)),initial);
 }
});
