import {systemsLessons,sources} from './systems-curriculum.js';
import {mountLab} from './systems-labs.js';

const app=document.querySelector('#app');
const base=new URL('../',import.meta.url).pathname;
const topic=base+'topics/distributed-systems/';
const slug=location.pathname.slice(topic.length).split('/')[0];
const index=systemsLessons.findIndex(l=>l.slug===slug);
const lesson=systemsLessons[index];
const $=s=>document.querySelector(s);
let cleanup=()=>{};
const answers=new Map();
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const header=()=>`<a class="skip" href="#main">Skip to content</a><header class="topbar"><a class="brand" href="${base}"><span class="brand-icon">ƒ</span>fieldnotes<span class="muted" style="font-weight:400">/</span></a><nav class="toplinks" aria-label="Main"><a href="${base}">The library</a><a href="${topic}" class="active">Distributed systems</a></nav></header>`;
const details=(title,body)=>`<details><summary>${title}</summary><div class="detail-body">${body}</div></details>`;
document.body.classList.add('systems-page');

function topicPage(){
 document.title='Distributed Systems — Fieldnotes';
 app.innerHTML=header()+`<main id="main" class="library"><div class="eyebrow accent">Topic 02 / Software engineering</div><div class="library-heading"><h1>Distributed<br><span class="accent">systems.</span></h1><p>Build, scale, and operate systems under uncertainty.<br>Eight lessons. Thirty-two experiments.</p></div><div class="ds-course-intro"><p><b>Start with a promise.</b> What must remain true when machines fail, messages arrive twice, or demand jumps?</p><p class="small">Assumes basic HTTP, processes, and database operations. Follow the sequence or enter at the idea you need.</p></div><div class="section-line"><h3>The learning path</h3><small>Foundations to production</small></div><div class="ds-course-grid">${systemsLessons.map((l,i)=>`<a class="ds-course-card" href="${topic+l.slug}/"><span class="eyebrow accent">${l.tag}</span><h2>${l.title}</h2><p>${l.summary}</p><div class="chip-row">${l.chapters.map(c=>`<span class="chip">${c.id}</span>`).join('')}</div><span class="small">4 experiments · questions & primary sources</span></a>`).join('')}</div><div class="section-line"><h3>The skill you are building</h3></div><div class="grid3"><div class="ds-learning-goal"><span class="eyebrow accent">Design</span><p>State the invariant. Estimate the workload. Place coordination where it earns its cost.</p></div><div class="ds-learning-goal"><span class="eyebrow accent">Build</span><p>Make effects durable, retries safe, and old and new versions compatible.</p></div><div class="ds-learning-goal"><span class="eyebrow accent">Operate</span><p>Find the bottleneck, limit the blast radius, and prove that recovery works.</p></div></div>${details('Coverage map',systemsLessons.map(l=>`<p><b>${l.title}.</b> ${l.chapters.map(c=>c.title).join(' ')}</p>`).join(''))}<p class="note">Experiments are small, explicit models. Their assumptions appear beside the result. Production implementations require deeper protocol and product-specific validation.</p><footer class="library-foot"><a href="${base}">Back to the library</a><span>Fieldnotes / Software engineering</span></footer></main>`;
}

function shell(){
 app.innerHTML=header()+`<div class="mobile-nav"><label for="systems-chapter" class="small">Lesson and chapter</label><select id="systems-chapter">${systemsLessons.map(l=>`<optgroup label="${l.title}">${l.chapters.map(c=>`<option value="${topic+l.slug}/#${c.id}">${c.title}</option>`).join('')}</optgroup>`).join('')}</select></div><div class="layout"><aside class="sidebar"><a class="back" href="${topic}">‹ Distributed systems</a><h3>From foundations<br>to production</h3><nav aria-label="Lessons and chapters">${systemsLessons.map((l,i)=>`<div class="eyebrow">Lesson ${String(i+1).padStart(2,'0')}</div><a class="chapter-link ${i===index?'ds-current-lesson':''}" href="${topic+l.slug}/">${l.title}</a>${i===index?l.chapters.map((c,j)=>`<a class="chapter-link ds-chapter-link" data-chapter="${c.id}" href="#${c.id}"><span class="num">${j+1}</span>${c.id.replaceAll('-',' ')}</a>`).join(''):''}`).join('')}</nav><div class="sidebar-note">Change one assumption.<br>Observe the consequence.<br>Explain the trade-off.</div></aside><main id="main" class="lesson-main" tabindex="-1"></main></div>`;
 $('#systems-chapter').onchange=e=>{location.href=e.target.value;};
 renderChapter();
 window.addEventListener('hashchange',()=>{if(location.hash==='#main'){document.querySelector('#main').focus();return;}renderChapter();window.scrollTo({top:0,behavior:'instant'});$('#chapter-title').focus({preventScroll:true});});
}

function renderChapter(){
 cleanup();const chapterIndex=Math.max(0,lesson.chapters.findIndex(c=>c.id===location.hash.slice(1)));const c=lesson.chapters[chapterIndex];
 document.title=`${c.title} · Distributed Systems — Fieldnotes`;
 document.querySelectorAll('[data-chapter]').forEach(el=>{const active=el.dataset.chapter===c.id;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
 $('#systems-chapter').value=topic+lesson.slug+'/#'+c.id;
 const next=chapterIndex<lesson.chapters.length-1?['Next: '+lesson.chapters[chapterIndex+1].id,'#'+lesson.chapters[chapterIndex+1].id]:index<systemsLessons.length-1?['Next lesson',topic+systemsLessons[index+1].slug+'/']:['Back to the topic',topic];
 $('#main').innerHTML=`<div class="breadcrumbs"><a href="${base}">Library</a><span>/</span><a href="${topic}">Distributed systems</a><span>/</span><span>Lesson ${index+1}</span></div><div class="chapter-meta"><span class="eyebrow">${lesson.tag}</span><span class="dots" aria-label="Chapter ${chapterIndex+1} of 4">${lesson.chapters.map((_,i)=>`<i class="${i<=chapterIndex?'on':''}"></i>`).join('')}</span></div><div class="lesson-heading"><div><h1 id="chapter-title" tabindex="-1">${c.title}</h1><p>${c.lede}</p></div></div><div id="systems-lab" class="scene"></div><div class="takeaway"><span class="eyebrow">The key idea</span><p>${c.takeaway}</p></div>${c.depth.map(([title,text])=>details(title,`<p>${text}</p>`)).join('')}<section class="ds-check" aria-label="Check your understanding"><span class="eyebrow accent">Think it through</span><h3>${c.question}</h3><div class="quiz-options" id="chapter-quiz"></div><div id="quiz-feedback"></div></section>${details('Primary sources & model scope',`<div class="source-list">${c.source.map(key=>`<a class="source-item" href="${sources[key][1]}" target="_blank" rel="noopener">${sources[key][0]}</a>`).join('')}</div><p class="note">The experiment illustrates one mechanism under stated assumptions. It is not a protocol implementation, benchmark, or correctness proof. Source links checked 6 October 2026.</p>`)}<footer class="lesson-footer"><a class="btn subtle" href="${chapterIndex?'#'+lesson.chapters[chapterIndex-1].id:topic}">${chapterIndex?'Previous':'Topic overview'}</a><a class="btn primary" href="${next[1]}">${next[0]}</a></footer>`;
 cleanup=mountLab($('#systems-lab'),c.lab);
 function drawQuiz(){const a=answers.get(c.id);$('#chapter-quiz').innerHTML=c.options.map((o,i)=>`<button data-answer="${i}" class="${a!==undefined?(i===c.answer?'correct':i===a?'wrong':''):''}" ${a!==undefined?'disabled':''}>${escape(o)}</button>`).join('');$('#quiz-feedback').innerHTML=a===undefined?'':`<div class="insight" role="status"><b>${a===c.answer?'Exactly.':'Not quite.'}</b> ${c.explanation}</div><button class="ds-reset" id="retry-question">Try again</button>`;document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{answers.set(c.id,+b.dataset.answer);drawQuiz();});if($('#retry-question'))$('#retry-question').onclick=()=>{answers.delete(c.id);drawQuiz();};}drawQuiz();
}

if(!slug||slug==='index.html')topicPage();
else if(lesson)shell();
else{app.innerHTML=header()+`<main id="main" class="library"><h1>Lesson not found.</h1><p class="hint">Choose a lesson from the topic index.</p><a class="btn primary" href="${topic}">Distributed systems</a></main>`;}
