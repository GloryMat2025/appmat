
async function inject(selector, url){
  const el = document.querySelector(selector);
  if(!el) return;
  const res = await fetch(url);
  el.innerHTML = await res.text();
}
async function boot(){
  await inject('header[site-part]','/components/header.html');
  await inject('footer[site-part]','/components/footer.html');
  // Modal handlers
  document.body.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-open]'); if(t){ e.preventDefault();
      document.querySelector(t.dataset.open)?.classList.add('show'); return; }
    const c = e.target.closest('[data-close]'); if(c){ e.preventDefault();
      document.querySelector(c.dataset.close)?.classList.remove('show'); return; }
    const out = e.target.classList.contains('modal'); if(out){ e.target.classList.remove('show'); }
  });
}
document.addEventListener('DOMContentLoaded', boot);
