// Deliberately small models. Units and assumptions are exposed in each lab.
export const majority=n=>Math.floor(n/2)+1;
export function queueModel(arrival,capacity){const rho=arrival/capacity;return {rho,stable:rho<1,time:rho<1?1/(capacity-arrival):Infinity,inflight:rho<1?arrival/(capacity-arrival):Infinity};}
export const tailProbability=(p,n)=>1-(1-p)**n;
export const quorum=(n,r,w)=>({overlap:r+w>n,writeOverlap:w*2>n,readFailures:n-r,writeFailures:n-w});
export function hash(text){let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function placement(key,n,method='rendezvous'){if(method==='modulo')return hash(key)%n;let owner=0,score=-1;for(let i=0;i<n;i++){const x=hash(`${i}:${key}:node`);if(x>score){score=x;owner=i;}}return owner;}
export function shardLoads(n,hotPercent,salted=false){const loads=Array(n).fill((100-hotPercent)/n);if(salted)for(let i=0;i<n;i++)loads[i]+=hotPercent/n;else loads[0]+=hotPercent;return loads;}
export function retrySchedule(clients,attempts,jitter){const buckets=Array(16).fill(0);for(let c=0;c<clients;c++)for(let a=0;a<attempts;a++){const bound=2**a;const delay=jitter?Math.floor((hash(`${c}-${a}`)%1000)/1000*bound):bound-1;buckets[Math.min(15,delay)]++;}return buckets;}
export function bucketStep(tokens,capacity,refill,requests){const available=Math.min(capacity,tokens+refill),accepted=Math.min(available,requests);return {tokens:available-accepted,accepted,rejected:requests-accepted};}
export function burnRate(slo,errorPercent,minutes){const budget=1-slo/100,rate=errorPercent/100/budget;return {rate,spent:rate*minutes/(30*24*60)*100,hours:rate===0?Infinity:30*24/rate};}
export function estimate(users,actions,readRatio,bytes,peak,days){const writes=users*actions/86400,reads=writes*readRatio;return {writes,reads,peak:(writes+reads)*peak,storage:users*actions*bytes*days,egress:reads*bytes*86400};}
export function vectorRelation(a,b){const le=a.every((v,i)=>v<=b[i]),ge=a.every((v,i)=>v>=b[i]);return le&&ge?'equal':le?'before':ge?'after':'concurrent';}
export function applyDelivery(state,id,amount,dedupe){if(dedupe&&state.seen.includes(id))return {...state,duplicate:true};return {total:state.total+amount,seen:[...state.seen,id],duplicate:false};}
export function recovery({backupAge,logLag,restoreMinutes,replayMinutes,pitr}){return {rpo:pitr?logLag:backupAge,rto:restoreMinutes+(pitr?replayMinutes:0)};}
