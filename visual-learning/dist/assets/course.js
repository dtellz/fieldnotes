// Shared navigation for courses with independently linkable lesson directories.
export function renderCourse(config) {
  const {lessons, sources, mountLab, title, slug: topicSlug} = config;
  const app = document.querySelector('#app');
  const base = new URL('../', import.meta.url).pathname;
  const topic = `${base}topics/${topicSlug}/`;
  const slug = location.pathname.slice(topic.length).split('/')[0];
  const index = lessons.findIndex(l => l.slug === slug);
  const lesson = lessons[index];
  const answers = new Map();
  let cleanup = () => {};
  const $ = selector => app.querySelector(selector);
  const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const details = (label, body) => `<details><summary>${label}</summary><div class="detail-body">${body}</div></details>`;
  const header = () => `<a class="skip" href="#main">Skip to content</a><header class="topbar"><a class="brand" href="${base}"><span class="brand-icon">ƒ</span>fieldnotes<span class="muted" style="font-weight:400">/</span></a><nav class="toplinks" aria-label="Main"><a href="${base}">The library</a><a href="${topic}" class="active">${config.shortTitle || title}</a></nav></header>`;
  document.body.classList.add('systems-page', config.theme || 'systems-page');

  if (!slug || slug === 'index.html') {
    document.title = `${title} — Fieldnotes`;
    app.innerHTML = header() + `<main id="main" class="library">
      <div class="eyebrow accent">${config.eyebrow}</div>
      <div class="library-heading"><h1>${config.heading}</h1><p>${config.summary}</p></div>
      <div class="ds-course-intro"><p>${config.intro}</p><p class="small">${config.prereq}</p></div>
      <div class="section-line"><h3>The learning path</h3><small>${lessons.length} lessons · ${lessons.reduce((n,l)=>n+l.chapters.length,0)} experiments</small></div>
      <div class="ds-course-grid">${lessons.map(l => `<a class="ds-course-card" href="${topic+l.slug}/"><span class="eyebrow accent">${l.tag}</span><h2>${l.title}</h2><p>${l.summary}</p><div class="chip-row">${l.chapters.map(c=>`<span class="chip">${c.id.replaceAll('-', ' ')}</span>`).join('')}</div><span class="small">${l.chapters.length} experiments · questions & primary sources</span></a>`).join('')}</div>
      <div class="section-line"><h3>The skill you are building</h3></div>
      <div class="grid3">${config.goals.map(([label,text])=>`<div class="ds-learning-goal"><span class="eyebrow accent">${label}</span><p>${text}</p></div>`).join('')}</div>
      ${details('Coverage map',lessons.map(l=>`<p><b>${l.title}.</b> ${l.chapters.map(c=>c.title).join(' ')}</p>`).join(''))}
      <p class="note">Experiments are small, explicit models. Their assumptions appear beside the result; the numbers are illustrative, not measurements of your machine.</p>
      <footer class="library-foot"><a href="${base}">Back to the library</a><span>Fieldnotes / Software engineering</span></footer></main>`;
    return;
  }
  if (!lesson) {
    app.innerHTML = header() + `<main id="main" class="library"><h1>Lesson not found.</h1><a class="btn primary" href="${topic}">Topic overview</a></main>`;
    return;
  }
  app.innerHTML = header() + `<div class="mobile-nav"><label for="systems-chapter" class="small">Lesson and chapter</label><select id="systems-chapter">${lessons.map(l=>`<optgroup label="${l.title}">${l.chapters.map(c=>`<option value="${topic+l.slug}/#${c.id}">${c.title}</option>`).join('')}</optgroup>`).join('')}</select></div>
    <div class="layout"><aside class="sidebar"><a class="back" href="${topic}">‹ ${config.shortTitle || title}</a><h3>${config.sidebar}</h3><nav aria-label="Lessons and chapters">${lessons.map((l,i)=>`<div class="eyebrow">Lesson ${String(i+1).padStart(2,'0')}</div><a class="chapter-link ${i===index?'ds-current-lesson':''}" href="${topic+l.slug}/">${l.title}</a>${i===index?l.chapters.map((c,j)=>`<a class="chapter-link ds-chapter-link" data-chapter="${c.id}" href="#${c.id}"><span class="num">${j+1}</span>${c.id.replaceAll('-',' ')}</a>`).join(''):''}`).join('')}</nav><div class="sidebar-note">Change one assumption.<br>Observe the consequence.<br>Explain the trade-off.</div></aside><main id="main" class="lesson-main" tabindex="-1"></main></div>`;
  $('#systems-chapter').onchange = e => { location.href = e.target.value; };

  function renderChapter() {
    cleanup();
    const chapterIndex = Math.max(0,lesson.chapters.findIndex(c=>c.id===location.hash.slice(1)));
    const c = lesson.chapters[chapterIndex];
    document.title = `${c.title} · ${title} — Fieldnotes`;
    app.querySelectorAll('[data-chapter]').forEach(el=>{
      const active = el.dataset.chapter === c.id;
      el.classList.toggle('active',active);
      if(active) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current');
    });
    $('#systems-chapter').value = topic+lesson.slug+'/#'+c.id;
    const next = chapterIndex<lesson.chapters.length-1
      ? ['Next: '+lesson.chapters[chapterIndex+1].id.replaceAll('-',' '),'#'+lesson.chapters[chapterIndex+1].id]
      : index<lessons.length-1 ? ['Next lesson',topic+lessons[index+1].slug+'/'] : ['Back to the topic',topic];
    $('#main').innerHTML = `<div class="breadcrumbs"><a href="${base}">Library</a><span>/</span><a href="${topic}">${config.shortTitle || title}</a><span>/</span><span>Lesson ${index+1}</span></div>
      <div class="chapter-meta"><span class="eyebrow">${lesson.tag}</span><span class="dots" aria-label="Chapter ${chapterIndex+1} of ${lesson.chapters.length}">${lesson.chapters.map((_,i)=>`<i class="${i<=chapterIndex?'on':''}"></i>`).join('')}</span></div>
      <div class="lesson-heading"><div><h1 id="chapter-title" tabindex="-1">${c.title}</h1><p>${c.lede}</p></div></div>
      <div id="systems-lab" class="scene"></div>
      <div class="takeaway"><span class="eyebrow">The key idea</span><p>${c.takeaway}</p></div>
      ${c.depth.map(([label,text])=>details(label,`<p>${text}</p>`)).join('')}
      <section class="ds-check" aria-label="Check your understanding"><span class="eyebrow accent">Think it through</span><h3>${c.question}</h3><div class="quiz-options" id="chapter-quiz"></div><div id="quiz-feedback"></div></section>
      ${details('Primary sources & model scope',`<div class="source-list">${c.source.map(key=>`<a class="source-item" href="${sources[key][1]}" target="_blank" rel="noopener">${sources[key][0]}</a>`).join('')}</div><p class="note">This experiment illustrates one mechanism under stated assumptions. It is not a benchmark or a complete implementation. Source links checked ${config.sourcesChecked || '6 October 2026'}.</p>`)}
      <footer class="lesson-footer"><a class="btn subtle" href="${chapterIndex?'#'+lesson.chapters[chapterIndex-1].id:topic}">${chapterIndex?'Previous':'Topic overview'}</a><a class="btn primary" href="${next[1]}">${next[0]}</a></footer>`;
    cleanup = mountLab($('#systems-lab'),c.lab);
    function drawQuiz() {
      const a = answers.get(c.id);
      $('#chapter-quiz').innerHTML = c.options.map((o,i)=>`<button data-answer="${i}" class="${a!==undefined?(i===c.answer?'correct':i===a?'wrong':''):''}" ${a!==undefined?'disabled':''}>${escape(o)}</button>`).join('');
      $('#quiz-feedback').innerHTML = a===undefined ? '' : `<div class="insight" role="status"><b>${a===c.answer?'Exactly.':'Not quite.'}</b> ${c.explanation}</div><button class="ds-reset" id="retry-question">Try again</button>`;
      app.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{answers.set(c.id,+b.dataset.answer);drawQuiz();});
      if($('#retry-question')) $('#retry-question').onclick=()=>{answers.delete(c.id);drawQuiz();};
    }
    drawQuiz();
  }
  renderChapter();
  window.addEventListener('hashchange',()=>{
    if(location.hash==='#main') { $('#main').focus(); return; }
    renderChapter();
    window.scrollTo({top:0,behavior:'instant'});
    $('#chapter-title').focus({preventScroll:true});
  });
}
