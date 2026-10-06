const fmt=(x,d=0)=>Number.isFinite(x)?x.toLocaleString('en',{maximumFractionDigits:d}):'Unbounded';
export function mountExperiment(element,spec){
 let state=structuredClone(spec.state);
 const controls=spec.controls.map(c=>c.kind==='range'?`<div class="control"><label for="control-${c.key}">${c.label}<output id="value-${c.key}"></output></label><input id="control-${c.key}" data-key="${c.key}" type="range" min="${c.min}" max="${c.max}" step="${c.step}"></div>`:c.kind==='choice'?`<label class="control">${c.label}<select data-key="${c.key}">${c.options.map(x=>`<option>${x}</option>`).join('')}</select></label>`:c.kind==='toggle'?`<label class="check"><input type="checkbox" data-key="${c.key}">${c.label}</label>`:`<button class="btn subtle" data-action="${c.key}">${c.label}</button>`).join('');
 element.innerHTML=`<section class="lab ds-lab"><div class="lab-head"><span class="lab-title">${spec.title}</span><button class="ds-reset" data-reset>Reset</button></div><div class="ds-controls">${controls}</div><div class="lab-body" id="lab-output"></div><div class="lab-foot"><span>${spec.foot}</span></div></section>`;
 function draw(){element.querySelectorAll('[data-key]').forEach(el=>{const k=el.dataset.key;if(el.type==='checkbox')el.checked=state[k];else el.value=state[k];const out=element.querySelector('#value-'+k);if(out)out.textContent=fmt(state[k],2);});element.querySelector('#lab-output').innerHTML=spec.render(state);}
 element.oninput=e=>{const el=e.target;if(el.dataset.key){state[el.dataset.key]=el.type==='checkbox'?el.checked:el.type==='range'?+el.value:el.value;spec.onChange?.(state,el.dataset.key);draw();}};
 element.onchange=e=>{if(e.target.tagName==='SELECT'){state[e.target.dataset.key]=e.target.value;spec.onChange?.(state,e.target.dataset.key);draw();}};
 element.onclick=e=>{const reset=e.target.closest('[data-reset]'),action=e.target.closest('[data-action]');if(reset){state=structuredClone(spec.state);draw();}else if(action){spec.actions?.[action.dataset.action]?.(state);draw();}};draw();
 return ()=>{element.oninput=null;element.onchange=null;element.onclick=null;};
}
