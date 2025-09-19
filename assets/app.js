import { mdToHtml } from './md.js';

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const CONFIG_URL = 'assets/config.json';

const App = {
  config: null,
  routes: new Map(),

  async init(){
    await this.loadConfig();
    this.buildNav();
    this.applyTheme();
    this.bindEvents();
    this.renderHero();
    this.route();
  },

  async loadConfig(){
    const res = await fetch(CONFIG_URL);
    this.config = await res.json();

    // Build routes from config.sections
    this.config.sections.forEach(s => {
      this.routes.set(s.id, s.md);
    });
  },

  buildNav(){
    const menu = $('#menu');
    menu.innerHTML = '';
    for(const s of this.config.sections){
      const a = document.createElement('a');
      a.href = `#/${s.id}`;
      a.textContent = s.title;
      a.setAttribute('data-id', s.id);
      menu.appendChild(a);
    }
  },

  setActive(id){
    $$('#menu a').forEach(a => {
      if(a.getAttribute('data-id') === id) a.classList.add('active');
      else a.classList.remove('active');
    });
  },

  applyTheme(){
    const saved = localStorage.getItem('theme');
    const theme = saved || this.config.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  },

  toggleTheme(){
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  },

  bindEvents(){
    window.addEventListener('hashchange', () => this.route());
    $('#themeToggle').addEventListener('click', () => this.toggleTheme());

    const scrollTop = $('#scrollTop');
    window.addEventListener('scroll', () => {
      if(window.scrollY > 240) scrollTop.classList.add('show');
      else scrollTop.classList.remove('show');
    });
    scrollTop.addEventListener('click', () => window.scrollTo({top:0, behavior:"smooth"}));
  },

  renderHero(){
    $('#brand-name').textContent = this.config.name;
    $('#hero-title').textContent = this.config.name;
    $('#hero-tagline').textContent = this.config.tagline;
    if(this.config.avatar) {
      const url = this.config.avatar;
      $('.brand .avatar').src = url;
      $('.hero-avatar').src = url;
    }

    const links = (this.config.links || []).map(l => `<a href="${l.href}" target="_blank" rel="noopener">${l.icon || '↗'} ${l.title}</a>`).join(' · ');
    $('#hero-links').innerHTML = links;
    $('#footer').innerHTML = `© ${new Date().getFullYear()} ${this.config.name} · Built with <span aria-hidden="true">♥</span>`;
    document.title = `${this.config.name} · ${this.config.tagline}`;
  },

  route(){
    const hash = location.hash.replace(/^#\//, '') || 'home';
    this.setActive(hash);
    this.loadPage(hash);
  },

  async loadPage(id){
    const mdFile = this.routes.get(id);
    const contentEl = $('#content');
    if(!mdFile){
      contentEl.innerHTML = `<p class="muted">未找到页面：<code>${id}</code></p>`;
      return;
    }
    try{
      const res = await fetch(`content/${mdFile}`);
      const md = await res.text();
      const html = mdToHtml(md);
      contentEl.innerHTML = html;
      // Smooth anchor navigation
      $$('#content h2, #content h3').forEach(h => {
        h.addEventListener('click', () => location.hash = `#/${id}#${h.id}`);
        h.style.cursor = 'pointer';
      });
      // If there's an anchor in the URL after second '#'
      const anchor = location.hash.split('#')[2];
      if(anchor){
        const el = document.getElementById(anchor);
        if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
      }
      document.title = `${this.config.name} · ${this.config.sections.find(s=>s.id===id)?.title || ''}`;
    }catch(e){
      contentEl.innerHTML = `<p class="muted">加载失败。请通过本地服务器打开此站点（例如：<span class="kbd">python -m http.server</span>）。</p>`;
    }
  }
};

App.init();
