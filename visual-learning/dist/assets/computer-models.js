// Deterministic teaching models. Units and assumptions are stated beside each lab.
export function integer8(value, add) {
  const unsigned = (value + add) % 256;
  return {unsigned, signed: unsigned < 128 ? unsigned : unsigned - 256,
    bits: unsigned.toString(2).padStart(8, '0'), carry: value + add > 255};
}

export function pipeline(chains, width = 2, latency = 3, count = 12) {
  const ready = Array(chains).fill(0), instructions = [];
  let cycle = 0, next = 0;
  while (next < count) {
    let issued = 0;
    while (issued < width && next < count && ready[next % chains] <= cycle) {
      const chain = next % chains;
      instructions.push({id: next, chain, start: cycle, end: cycle + latency});
      ready[chain] = cycle + latency;
      next++; issued++;
    }
    cycle++;
  }
  return {instructions, cycles: Math.max(...instructions.map(i=>i.end))};
}

export function branches(pattern) {
  const patterns = {Steady:Array(24).fill(1), Alternating:Array.from({length:24},(_,i)=>i%2),
    Clustered:Array.from({length:24},(_,i)=>Math.floor(i/6)%2),
    Irregular:[1,0,0,1,1,0,1,0,0,0,1,1,0,1,1,1,0,0,1,0,1,0,0,1]};
  let counter = 1;
  return patterns[pattern].map(actual=>{
    const prediction = Number(counter >= 2), before = counter;
    counter = Math.max(0,Math.min(3,counter+(actual?1:-1)));
    return {actual,prediction,miss:actual!==prediction,before,after:counter};
  });
}

export function parallelTime(fraction, workers, overhead) {
  const serial = 100*(1-fraction), parallel = 100*fraction/workers;
  const coordination = overhead*(workers-1);
  return {serial,parallel,coordination,total:serial+parallel+coordination,
    speedup:100/(serial+parallel+coordination)};
}

export function matrixAccess(order, size = 8) {
  const result = [];
  if (order === 'Tiled') {
    for(let row=0;row<size;row+=4)for(let col=0;col<size;col+=4)
      for(let c=col;c<col+4;c++)for(let r=row;r<row+4;r++)result.push(r*size+c);
  } else {
    for(let i=0;i<size;i++)for(let j=0;j<size;j++)result.push(order==='Rows'?i*size+j:j*size+i);
  }
  return result;
}

export function cacheTrace(addresses, capacity = 4, lineWords = 4) {
  const cache = [];
  return addresses.map(address=>{
    const line = Math.floor(address/lineWords), index = cache.indexOf(line), hit = index!==-1;
    let evicted = null;
    if(hit)cache.splice(index,1);
    else if(cache.length===capacity)evicted=cache.shift();
    cache.push(line);
    return {address,line,hit,evicted,cache:[...cache]};
  });
}

export function sharing(padded, writes) {
  const owners = new Map(); let transfers = 0;
  const trace = Array.from({length:writes},(_,i)=>{
    const core = i%2, line = padded?core:0, previous = owners.get(line);
    const transfer = previous!==undefined&&previous!==core;
    if(transfer)transfers++;
    owners.set(line,core);
    return {core,line,transfer};
  });
  return {trace,transfers,bytes:padded?128:64};
}

export function roofline(intensity, bandwidth, peak) {
  return {attainable:Math.min(peak,intensity*bandwidth),ridge:peak/bandwidth,
    bound:intensity*bandwidth<peak?'Memory bandwidth':'Compute throughput'};
}

export function schedule(policy, quantum, switchCost = 1) {
  const remaining = [12,3,3], starts = [null,null,null], ends = [0,0,0], segments = [];
  let time = 0, previous = null;
  const queue = policy==='Shortest first'?[1,2,0]:[0,1,2];
  while(queue.length) {
    const job = queue.shift();
    if(previous!==null&&previous!==job&&switchCost) { segments.push({job:'switch',start:time,duration:switchCost});time+=switchCost; }
    if(starts[job]===null)starts[job]=time;
    const duration = policy==='Round robin'?Math.min(quantum,remaining[job]):remaining[job];
    segments.push({job,start:time,duration});time+=duration;remaining[job]-=duration;
    if(remaining[job])queue.push(job);else ends[job]=time;
    previous=job;
  }
  return {segments,starts,ends,time,overhead:time-18};
}

export function translation(address, pageSize = 4096) {
  const vpn = Math.floor(address/pageSize), offset=address%pageSize;
  // Deliberately noncontiguous physical frames.
  const frame = [6,2,9,4][vpn];
  return {vpn,offset,frame,physical:frame*pageSize+offset};
}

export function memoryBudget(heap, native, cache, limit) {
  const total=heap+native+cache, reclaim=Math.min(cache,Math.max(0,total-limit));
  return {total,reclaim,after:total-reclaim,excess:Math.max(0,heap+native-limit)};
}

export function raceStep(state, thread, atomic) {
  const s=structuredClone(state);
  if(s.pc[thread]>=2)return s;
  if(atomic){s.value++;s.pc[thread]=2;s.log.push(`${thread}: atomic increment → ${s.value}`);}
  else if(s.pc[thread]===0){s.local[thread]=s.value;s.pc[thread]=1;s.log.push(`${thread}: reads ${s.value}`);}
  else {s.value=s.local[thread]+1;s.pc[thread]=2;s.log.push(`${thread}: writes ${s.value}`);}
  return s;
}

export function lockStep(state, thread, ordered) {
  const s=structuredClone(state), order=thread==='A'||ordered?['X','Y']:['Y','X'];
  if(s.pc[thread]>=3)return s;
  if(s.pc[thread]===2){for(const key of ['X','Y'])if(s.owners[key]===thread)s.owners[key]=null;s.pc[thread]=3;return s;}
  const lock=order[s.pc[thread]];
  if(s.owners[lock]===null){s.owners[lock]=thread;s.pc[thread]++;}
  return s;
}

export function batchCost(batch, arrivalRate) {
  const calls=Math.ceil(1024/batch), overhead=calls*2, copying=1024*.02;
  return {calls,overhead,copying,total:overhead+copying,fill:(batch-1)/arrivalRate*1000};
}

export function eventLoop(blocking, cpu) {
  // Request A: cpu ms compute then 40 ms I/O. B: 2 ms compute, arrives at t=5.
  const aEnd=cpu+40, bStart=blocking?Math.max(5,aEnd):Math.max(5,cpu), bEnd=bStart+2;
  return {aEnd,bStart,bEnd,bLatency:bEnd-5};
}

export function tcpThroughput(windowKiB, rttMs, linkMbps) {
  const windowMbps=windowKiB*1024*8/(rttMs/1000)/1e6;
  return {windowMbps,throughput:Math.min(linkMbps,windowMbps),bdpKiB:linkMbps*1e6/8*(rttMs/1000)/1024};
}

export function percentile(values, p) {
  if(!values.length)throw Error('A percentile needs observations');
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted[Math.max(0,Math.ceil(p*sorted.length)-1)];
}

export function latencySample(slowPercent, slowMs) {
  return Array.from({length:100},(_,i)=>i<slowPercent?slowMs:10);
}

export function benchmark(order, warmed, consume) {
  const versions=order==='Grouped'?['A','A','A','A','A','B','B','B','B','B']:['A','B','A','B','A','B','A','B','A','B'];
  return versions.map((version,i)=>({version,ms:consume?(version==='A'?10:8)+(warmed?0:i<2?12:0)+i*.5:0.1}));
}
