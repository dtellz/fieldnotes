import test from 'node:test';
import assert from 'node:assert/strict';
import {attention,softmax,dot,rotate,rmsNorm,cacheBytes,routeExperts,values} from '../dist/assets/math.js';
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,`${a} ≠ ${b}`);
test('softmax is stable for large logits and ignores masked positions',()=>{
 const p=softmax([10000,10000,-Infinity]);close(p[0],.5);close(p[1],.5);assert.equal(p[2],0);
});
test('causal attention cannot read the future and the first token reads only itself',()=>{
 for(let row=0;row<6;row++){const a=attention(.6,row,true);close(a.weights.reduce((s,x)=>s+x,0),1);a.weights.slice(row+1).forEach(w=>assert.equal(w,0));}
 const a=attention(1,0,true);a.output.forEach((v,i)=>close(v,values[0][i]));
 assert.ok(attention(.6,2,false).weights[5]>0);
});
test('value mixture lies inside the component-wise convex bounds',()=>{
 for(let degrees=0;degrees<360;degrees+=9){const a=attention(degrees*Math.PI/180,5,true,.2);a.output.forEach((x,d)=>assert.ok(x>=Math.min(...values.map(v=>v[d]))&&x<=Math.max(...values.map(v=>v[d]))));}
});
test('shared RoPE position shifts preserve query/key dot products',()=>{
 const q=[1,0],k=[.8,.6];for(let m=0;m<13;m++)for(let n=0;n<13;n++)for(let shift=0;shift<13;shift++)close(dot(rotate(q,m*.5),rotate(k,n*.5)),dot(rotate(q,(m+shift)*.5),rotate(k,(n+shift)*.5)));
});
test('RMS normalization is finite at zero and approximately unit RMS otherwise',()=>{
 assert.deepEqual(rmsNorm([0,0]),[0,0]);const a=rmsNorm([.8,-.4,.2,1.1]);close(dot(a,a)/a.length,1,1e-5);
});
test('cache doubles with context; 8 KV heads cost one quarter of 32',()=>{
 close(cacheBytes(32768,32),2*cacheBytes(16384,32));close(cacheBytes(16384,8),cacheBytes(16384,32)/4);assert.equal(cacheBytes(16384,32),8*1024**3);
});
test('expert routing selects top-k and renormalizes selected scores',()=>{
 const r=routeExperts([.1,2,-1,1],2);assert.deepEqual(r.map(x=>x.i),[1,3]);close(r.reduce((s,x)=>s+x.w,0),1);
});
test('output bias gradient descent decreases the target cross entropy',()=>{
 let logits=[.1,.6,-.2,.3],loss=-Math.log(softmax(logits)[0]);for(let step=0;step<30;step++){const p=softmax(logits);logits=logits.map((l,i)=>l-.5*(p[i]-(i===0?1:0)));const next=-Math.log(softmax(logits)[0]);assert.ok(next<loss);loss=next;}
});
