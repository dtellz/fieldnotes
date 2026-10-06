// Small, explicit numerical models used by the visual experiments.
export const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
export function softmax(values, temperature=1) {
  const max=Math.max(...values);
  const exp=values.map(x=>x===-Infinity?0:Math.exp((x-max)/temperature));
  const sum=exp.reduce((a,b)=>a+b,0);
  return exp.map(x=>x/sum);
}
export const keys=[[1,0],[.3,.95],[-.8,.6],[.7,-.7],[0,-1],[.8,.5]];
export const values=[[.9,.1],[.2,.8],[-.7,.5],[.5,-.3],[.1,-.8],[.6,.6]];
export function attention(angle,row=5,causal=true,temperature=1) {
  const q=[2*Math.cos(angle),2*Math.sin(angle)];
  const scores=keys.map((k,i)=>causal&&i>row?-Infinity:dot(q,k)/Math.sqrt(2));
  const weights=softmax(scores,temperature);
  const output=[0,1].map(d=>weights.reduce((s,w,i)=>s+w*values[i][d],0));
  return {q,scores,weights,output};
}
export const rotate=(v,angle)=>[v[0]*Math.cos(angle)-v[1]*Math.sin(angle),v[0]*Math.sin(angle)+v[1]*Math.cos(angle)];
export const rmsNorm=v=>{const rms=Math.sqrt(dot(v,v)/v.length+1e-6);return v.map(x=>x/rms)};
export const cacheBytes=(tokens,heads,layers=32,dim=128,bytes=2)=>2*tokens*heads*layers*dim*bytes;
export const routeExperts=(logits,k)=>{const p=softmax(logits);const selected=p.map((w,i)=>({w,i})).sort((a,b)=>b.w-a.w).slice(0,k);const sum=selected.reduce((s,x)=>s+x.w,0);return selected.map(x=>({...x,w:x.w/sum}));};
