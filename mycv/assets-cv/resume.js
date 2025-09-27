const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

async function loadJSON(url){ const r = await fetch(url); return await r.json(); }
async function loadText(url){ const r = await fetch(url); return await r.text(); }

const state = { lang: localStorage.getItem('resume_lang') || 'en', cfg: null };

function setLangLabel(){
  document.getElementById('langBtn').textContent = state.lang === 'zh' ? '中文' : 'English';
  document.documentElement.setAttribute('lang', state.lang === 'zh' ? 'zh-CN' : 'en');
}

function injectSprite(){
  fetch('assets/icons.svg').then(r=>r.text()).then(svg=>{ document.getElementById('svg-sprite').innerHTML = svg; });
}

function parseBib(src){
  const out = [];
  const re = /@(\w+)\s*\{\s*([^,]+),([\s\S]*?)\n\}/g;
  let m;
  while((m = re.exec(src))){
    const type = m[1].toLowerCase(); const key = m[2].trim(); const body = m[3];
    const fields = {}; body.replace(/\s*([\w\-]+)\s*=\s*\{([^}]*)\}\s*,?/g, (_,k,v)=>{ fields[k.toLowerCase()] = v.trim(); });
    const e = { type, key, ...fields };
    e._authors = (e.author||'').split(/ and /i).map(s=>s.trim()).filter(Boolean);
    e._year = Number(e.year)||0; e._venue = e.journal || e.booktitle || '';
    out.push(e);
  }
  out.sort((a,b)=> (b._year - a._year) || (a.title||'').localeCompare(b.title||''));
  return out;
}

function tag(text){ return `<span class="tag">${text}</span>`; }
function bar(value){ return `<div class="bar"><span style="width:${Math.max(0, Math.min(100, value))}%"></span></div>`; }

function render(cfg){
  const L = cfg[state.lang];
  document.getElementById('name').textContent = L.name;
  document.getElementById('title').textContent = L.title;
  document.getElementById('summary').textContent = L.summary;
  // contacts
  const ul = document.getElementById('contacts'); ul.innerHTML = '';
  (L.contacts||[]).forEach(c => {
    const li = document.createElement('li');
    li.innerHTML = `<svg class="icon"><use href="#${c.icon||'link'}"/></svg><a href="${c.href||'#'}">${c.text}</a>`;
    ul.appendChild(li);
  });
  // experiences
  const ex = document.getElementById('experiences'); ex.innerHTML = '';
  (L.experiences||[]).forEach(e => {
    const div = document.createElement('div'); div.className='entry';
    div.innerHTML = `<div><span class="role">${e.title}</span> · <span class="org">${e.org}</span> <span class="time">${e.time}</span></div>` +
                    (e.where?`<div class="org">${e.where}</div>`:'') +
                    `<ul class="bullets">` + (e.bullets||[]).map(x=>`<li>${x}</li>`).join('') + `</ul>`;
    ex.appendChild(div);
  });
  // projects
  const pj = document.getElementById('projects'); pj.innerHTML = '';
  (L.projects||[]).forEach(p => {
    const div = document.createElement('div'); div.className='entry';
    div.innerHTML = `<div class="role"><a href="${p.link||'#'}" target="_blank" rel="noopener">${p.name}</a></div>
      <div class="org">${p.desc||''}</div>
      <div class="tags">${(p.tags||[]).map(t=>tag(t)).join('')}</div>`;
    pj.appendChild(div);
  });
  // skills
  const sk = document.getElementById('skills'); sk.innerHTML = '';
  Object.entries(L.skills||{}).forEach(([cat, arr]) => {
    const h = document.createElement('div'); h.className='entry';
    h.innerHTML = `<div class="role">${cat}</div>`;
    arr.forEach(s => { h.innerHTML += `<div class="org">${s.name}</div>${bar(s.value)}`; });
    sk.appendChild(h);
  });
  // education
  const ed = document.getElementById('education'); ed.innerHTML = '';
  (L.education||[]).forEach(x => {
    const d = document.createElement('div'); d.className='entry';
    d.innerHTML = `<div class="role">${x.degree}</div><div class="org">${x.school}</div><div class="time">${x.time}</div>`;
    ed.appendChild(d);
  });

  // i18n for titles
  document.getElementById('expTitle').textContent = state.lang==='zh' ? '实习/经历' : 'Internship Experiences';
  document.getElementById('projTitle').textContent = state.lang==='zh' ? '项目' : 'Projects';
  document.getElementById('paperTitle').textContent = state.lang==='zh' ? '论文' : 'Papers';
  document.getElementById('skillsTitle').textContent = state.lang==='zh' ? '技能' : 'Skills';
  document.getElementById('eduTitle').textContent = state.lang==='zh' ? '教育' : 'Education';
  document.getElementById('contactTitle').textContent = state.lang==='zh' ? '联系' : 'Contact';
  document.getElementById('pdfBtn').textContent = state.lang==='zh' ? '下载 PDF' : 'Download PDF';
}

async function renderPapers(){
  try{
    const bib = await loadText('content/papers.bib');
    const entries = parseBib(bib).slice(0,3);
    const box = document.getElementById('papers'); box.innerHTML = '';
    entries.forEach(e => {
      const li = document.createElement('div'); li.className='entry';
      const authors = e._authors.join(', ');
      const venue = e._venue ? ` <em>${e._venue}</em>` : '';
      const links = [
        e.url ? `<a href="${e.url}" target="_blank" rel="noopener">Link</a>` : '',
        e.doi ? `<a href="https://doi.org/${e.doi}" target="_blank" rel="noopener">DOI</a>` : ''
      ].filter(Boolean).join(' · ');
      li.innerHTML = `<div class="role">${e.title||''}</div>
        <div class="org">${authors}. ${venue}${e._year?`, ${e._year}.`:''}</div>
        <div class="tags">${links}</div>`;
      box.appendChild(li);
    });
  }catch(e){ /* ignore */ }
}

async function main(){
  setLangLabel();
  injectSprite();
  state.cfg = await loadJSON('assets/resume.json');
  render(state.cfg);
  await renderPapers();

  document.getElementById('langBtn').addEventListener('click', async () => {
    state.lang = (state.lang === 'en') ? 'zh' : 'en';
    localStorage.setItem('resume_lang', state.lang);
    setLangLabel();
    render(state.cfg);
  });

  document.getElementById('pdfBtn').addEventListener('click', () => window.print());
}

main();
