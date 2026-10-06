// Small teaching engines. Their assumptions are stated beside each experiment.
export const newPage=()=>({slots:[],upper:256,message:'Insert a row to begin.'});
export function pageInsert(page,size){
  const p=structuredClone(page),lower=16+2*(p.slots.length+1);
  if(p.upper-size<lower){p.message='No contiguous space for this row and a new slot. Try compacting.';return p;}
  p.upper-=size;p.slots.push({id:p.slots.length+1,offset:p.upper,size,live:true});
  p.message=`Inserted row ${p.slots.length}; its slot points to byte ${p.upper}.`;return p;
}
export function pageDelete(page){
  const p=structuredClone(page),row=p.slots.find(r=>r.live);
  if(row){row.live=false;p.message=`Row ${row.id} is dead; ${row.size} bytes remain until compaction.`;}
  else p.message='No live row to delete.';return p;
}
export function pageCompact(page){
  const p=structuredClone(page);p.upper=256;
  for(const row of p.slots){if(row.live){p.upper-=row.size;row.offset=p.upper;}else{row.size=0;row.offset=0;}}
  p.message='Live rows packed together. Slot numbers remain stable; dead slots stay reserved in this toy.';return p;
}
export function bufferAccess(state,page,write=false,capacity=3){
  const s=structuredClone(state),i=s.frames.findIndex(f=>f.page===page);s.accesses++;
  if(i>=0){const [f]=s.frames.splice(i,1);f.dirty ||= write;s.frames.push(f);s.hits++;s.message=`Page ${page}: hit.`;}
  else{
    let evicted=null;if(s.frames.length===capacity){evicted=s.frames.shift();if(evicted.dirty)s.writes++;}
    s.reads++;s.frames.push({page,dirty:write});
    s.message=`Page ${page}: miss${evicted?`; evict ${evicted.page}${evicted.dirty?' after writeback':''}`:''}.`;
  }
  return s;
}
export function layoutCost(rows,columns,projected,pageBytes=4096){
  return {rowPages:Math.ceil(rows*columns*8/pageBytes),columnPages:projected*Math.ceil(rows*8/pageBytes),useful:rows*projected*8};
}
export function encoding(order,distinct){
  const values=Array.from({length:64},(_,i)=>i%distinct);
  if(order==='Clustered')values.sort((a,b)=>a-b);
  const runs=[];for(const v of values){if(runs.at(-1)?.value===v)runs.at(-1).count++;else runs.push({value:v,count:1});}
  return {values,runs,raw:64*8,dictionary:distinct*8+64,rle:distinct*8+runs.length*2};
}

// B+ tree: keys live in leaves; separators are the minimum key in each right subtree.
const minKey=node=>node.leaf?node.keys[0]:minKey(node.children[0]);
const refresh=node=>{if(!node.leaf)node.keys=node.children.slice(1).map(minKey);};
export const newTree=()=>({leaf:true,keys:[]});
export function treeInsert(tree,key,maxKeys=3){
  const root=structuredClone(tree);
  function insert(node){
    if(node.leaf){
      if(node.keys.includes(key))return null;
      node.keys.push(key);node.keys.sort((a,b)=>a-b);
      if(node.keys.length<=maxKeys)return null;
      return {leaf:true,keys:node.keys.splice(Math.ceil(node.keys.length/2))};
    }
    let i=0;while(i<node.keys.length&&key>=node.keys[i])i++;
    const sibling=insert(node.children[i]);if(sibling)node.children.splice(i+1,0,sibling);refresh(node);
    if(node.keys.length<=maxKeys)return null;
    const right={leaf:false,keys:[],children:node.children.splice(Math.ceil(node.children.length/2))};
    refresh(node);refresh(right);return right;
  }
  const sibling=insert(root);if(!sibling)return root;
  const top={leaf:false,keys:[],children:[root,sibling]};refresh(top);return top;
}
export function treeSearch(tree,key){
  const path=[];let node=tree;
  while(true){path.push(node);if(node.leaf)break;let i=0;while(i<node.keys.length&&key>=node.keys[i])i++;node=node.children[i];}
  return {path,found:node.keys.includes(key)};
}
export const treeLeaves=tree=>tree.leaf?[tree]:tree.children.flatMap(treeLeaves);
export function composite(order,tenant,day){
  const entries=[];for(let t=1;t<=3;t++)for(let d=1;d<=8;d++)entries.push({tenant:t,day:d});
  entries.sort((a,b)=>order==='Tenant, day'?a.tenant-b.tenant||a.day-b.day:a.day-b.day||a.tenant-b.tenant);
  const scanned=entries.filter(e=>order==='Tenant, day'?e.tenant===tenant&&e.day>=day:e.day>=day);
  return {entries,scanned,result:scanned.filter(e=>e.tenant===tenant&&e.day>=day)};
}
export function lsmPut(state,key,value){const s=structuredClone(state);s.seq++;s.mem=s.mem.filter(e=>e.key!==key);s.mem.push({key,value,seq:s.seq});return s;}
export function lsmFlush(state){const s=structuredClone(state);if(s.mem.length){s.runs.unshift([...s.mem].sort((a,b)=>a.key.localeCompare(b.key)));s.mem=[];}return s;}
export function lsmRead(state,key){
  const sources=[state.mem,...state.runs];let probes=0;
  for(const source of sources){if(!source.length)continue;probes++;const row=source.find(e=>e.key===key);if(row)return {value:row.value,found:row.value!==null,probes,seq:row.seq};}
  return {value:null,found:false,probes,seq:null};
}
function hash(key,seed){let h=seed;for(const char of String(key)){h=Math.imul(h^char.charCodeAt(0),16777619)>>>0;}return h;}
export function bloomPositions(key,bits,k){return Array.from({length:k},(_,i)=>hash(key,2166136261+i*104729)%bits);}
export function bloom(keys,bits,k,query){
  const cells=Array(bits).fill(false);for(const key of keys)for(const pos of bloomPositions(key,bits,k))cells[pos]=true;
  const positions=bloomPositions(query,bits,k),maybe=positions.every(i=>cells[i]);
  return {cells,positions,maybe,present:keys.includes(query)};
}
export function accessPlan(estimatedPercent,actualPercent,randomCost=4){
  const scan=1000,index=p=>3+Math.ceil(p*100)*randomCost;
  const choice=index(estimatedPercent)<scan?'Index scan':'Sequential scan';
  return {scan,estimatedIndex:index(estimatedPercent),actualIndex:index(actualPercent),choice,actualCost:choice==='Index scan'?index(actualPercent):scan};
}
export function joinCost(outer,inner,indexed,sorted){
  return {nested:outer*(indexed?Math.ceil(Math.log2(inner+1))+1:inner),hash:outer+inner,
    merge:outer+inner+(sorted?0:Math.ceil(outer*Math.log2(Math.max(2,outer))+inner*Math.log2(Math.max(2,inner))))};
}
export function externalSort(rows,memoryRows,fanIn=4){
  const initialRuns=Math.ceil(rows/memoryRows);let runs=initialRuns,passes=0;const levels=[runs];
  while(runs>1){runs=Math.ceil(runs/fanIn);levels.push(runs);passes++;}
  return {initialRuns,passes,levels,tempRowTransfers:2*rows*passes};
}
export function pagination(inserted,method){
  const original=Array.from({length:20},(_,i)=>100-i),first=original.slice(0,5);
  const current=inserted?[102,101,...original]:original;
  const second=method==='Offset'?current.slice(5,10):current.filter(id=>id<first.at(-1)).slice(0,5);
  return {first,second,duplicates:second.filter(id=>first.includes(id))};
}
export function visibleVersion(versions,snapshot){
  return versions.filter(v=>v.commit<=snapshot).at(-1);
}
export function writeSkew(serializable,step){return {a:step<3,b:step<4||serializable,aborted:serializable&&step>=4};}
export function reservation(state,client,enforceUnique){
  const s=structuredClone(state);if(s.done.includes(client))return s;
  if(enforceUnique&&s.rows.length){s.rejected.push(client);}else s.rows.push(client);
  s.done.push(client);return s;
}
export function redoPage(page,records,durableLSN){
  const result={...page};let applied=0;
  for(const record of records)if(record.lsn<=durableLSN&&record.lsn>result.lsn){result.value=record.value;result.lsn=record.lsn;applied++;}
  return {page:result,applied};
}
export function checkpointStep(state){
  const s=structuredClone(state);s.time++;const page=(s.time-1)%6;
  s.dirty[page]=true;s.log++;
  if(s.time%s.interval===0){s.writes+=s.dirty.filter(Boolean).length;s.dirty.fill(false);s.checkpoint=s.log;s.count++;}
  return s;
}
export function pitr(target,gap){
  const events=[{lsn:1,delta:10},{lsn:2,delta:20},{lsn:3,delta:-130},{lsn:4,delta:5}];
  const required=events.filter(e=>e.lsn<=target),blocked=gap>0&&gap<=target;
  return {reachable:!blocked,value:blocked?null:required.reduce((n,e)=>n+e.delta,100),events};
}
export function vacuumVersions(oldest){
  // Each version is visible in [born, replaced); the final one is current.
  return [{born:10,replaced:20},{born:20,replaced:30},{born:30,replaced:40},{born:40,replaced:Infinity}]
    .map(v=>({...v,reclaimable:v.replaced<=oldest}));
}
export function compactRuns(runs,dropTombstones){
  const latest=new Map();for(const run of runs)for(const e of run){const old=latest.get(e.key);if(!old||old.seq<e.seq)latest.set(e.key,{...e});}
  return [...latest.values()].filter(e=>!dropTombstones||e.value!==null).sort((a,b)=>a.key.localeCompare(b.key));
}
export function partitionScan(start,end,prunable){return Array.from({length:12},(_,i)=>({month:i+1,read:!prunable||(i+1>=start&&i+1<=end)}));}
