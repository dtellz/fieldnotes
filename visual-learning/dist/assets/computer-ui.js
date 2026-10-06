export const R=(key,label,min,max,step=1)=>({kind:'range',key,label,min,max,step});
export const C=(key,label,options)=>({kind:'choice',key,label,options});
export const T=(key,label)=>({kind:'toggle',key,label});
export const B=(key,label)=>({kind:'button',key,label});
export const fmt=(x,d=1)=>x.toLocaleString('en',{maximumFractionDigits:d});
export const stats=(...items)=>`<div class="ds-stats">${items.map(([label,value])=>`<div class="stat"><strong>${value}</strong><small>${label}</small></div>`).join('')}</div>`;
export const note=(text,warn=false)=>`<div class="insight ${warn?'ds-warning':''}" role="status">${text}</div>`;
export const node=(label,value,color='green')=>`<div class="node ${color}"><small>${label}</small><div class="ds-node-value">${value}</div></div>`;
export const flow=items=>`<div class="ds-flow">${items.map((item,i)=>`${i?'<span class="op" aria-hidden="true">→</span>':''}${node(...item)}`).join('')}</div>`;
export const table=(headers,rows)=>`<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export const colors=['#edbd85','#91cce2','#b6a6df','#bcd693','#e79494','#b3c0c6'];
export const legend=items=>`<div class="cs-legend">${items.map(([label,color])=>`<span><i style="background:${color}"></i>${label}</span>`).join('')}</div>`;
export const strip=(items,label='Work breakdown')=>{
  const total=Math.max(1,items.reduce((n,x)=>n+x[1],0));
  return `<div class="cs-strip" role="img" aria-label="${label}: ${items.map(([l,n])=>`${l} ${fmt(n)}`).join(', ')}">${items.filter(x=>x[1]>0).map(([l,n,c])=>`<div style="width:${n/total*100}%;background:${c}" title="${l}: ${fmt(n)}"></div>`).join('')}</div>`+legend(items.map(([l,n,c])=>[`${l}: ${fmt(n)}`,c]));
};
export const bars=items=>`<div class="cs-horizontal-bars">${items.map(([label,value,color])=>`<div><span>${label}</span><div><i style="width:${value/Math.max(1,...items.map(x=>x[1]))*100}%;background:${color||colors[0]}"></i></div><b>${fmt(value)}</b></div>`).join('')}</div>`;
export const timeline=(rows,max,unit='ms')=>`<div class="cs-timeline" role="img" aria-label="${rows.map(([label,start,duration])=>`${label}: ${start} to ${start+duration} ${unit}`).join('; ')}">${rows.map(([label,start,duration,color])=>`<div class="cs-time-row"><span>${label}</span><div class="cs-time-track"><i style="left:${start/max*100}%;width:${duration/max*100}%;background:${color||colors[0]}"></i></div><small>${start}–${start+duration}</small></div>`).join('')}<p class="small">Time → ${unit}</p></div>`;
export const plot=(body,label)=>`<div class="cs-plot"><svg viewBox="0 0 640 250" role="img" aria-label="${label}"><path d="M55 20V210H610" fill="none" stroke="#66706e"/>${body}</svg></div>`;
