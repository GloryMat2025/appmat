// i18n.loader.js
(function(global){
  const STORAGE_KEY='app.lang';
  const get=(o,p,d)=>{ if(!p) return d; return p.split('.').reduce((x,k)=>(x&&x[k]!=null)?x[k]:undefined,o) ?? d; };
  const interp=(s,v={})=>String(s).replace(/\{(\w+)\}/g,(_,k)=>(v[k]!==undefined?v[k]:'{'+k+'}'));
  const api={ lang:'en', dicts:{}, fallback:'en', _ready:false,
    async init({defaultLang='en', sources={}, fallback='en'}={}){
      this.lang=localStorage.getItem(STORAGE_KEY)||defaultLang; this.fallback=fallback||'en';
      const entries=Object.entries(sources);
      const res=await Promise.all(entries.map(async([code,url])=>{ try{ const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw new Error(r.status); return [code, await r.json()]; }catch(e){ console.warn('[i18n] load fail',code,url,e); return [code,{}]; } }));
      this.dicts=Object.fromEntries(res); this._ready=true; this.apply(); window.dispatchEvent(new CustomEvent('i18n:ready',{detail:{lang:this.lang}}));
      const enBtn=document.getElementById('langEN'); const bmBtn=document.getElementById('langBM');
      if(enBtn) enBtn.addEventListener('click',()=>this.set('en')); if(bmBtn) bmBtn.addEventListener('click',()=>this.set('bm'));
    },
    set(code){ this.lang=code; try{localStorage.setItem(STORAGE_KEY,code);}catch{} document.documentElement.lang=code==='bm'?'ms':'en';
      const enBtn=document.getElementById('langEN'); const bmBtn=document.getElementById('langBM'); if(enBtn) enBtn.classList.toggle('active',code==='en'); if(bmBtn) bmBtn.classList.toggle('active',code==='bm');
      this.apply(); window.dispatchEvent(new CustomEvent('i18n:change',{detail:{lang:code}})); },
    t(key,vars){ const d1=this.dicts[this.lang]||{}; const d2=this.dicts[this.fallback]||{}; const raw=get(d1,key) ?? get(d2,key) ?? key; return interp(raw,vars); },
    apply(){ if(!this._ready) return; document.querySelectorAll('[data-i18n]').forEach(n=>{ const k=n.getAttribute('data-i18n'); const t=this.t(k); n.textContent=t; if(t===k) n.dataset.i18nMissing='true'; else n.removeAttribute('data-i18n-missing'); });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(n=>{ const k=n.getAttribute('data-i18n-placeholder'); const t=this.t(k); n.setAttribute('placeholder',t); if(t===k) n.dataset.i18nMissing='true'; else n.removeAttribute('data-i18n-missing'); }); },
    extend(lang, patch){ this.dicts[lang]=Object.assign({}, this.dicts[lang]||{}, patch||{}); this.apply(); }
  };
  global.I18NLoader=api;
})(window);
