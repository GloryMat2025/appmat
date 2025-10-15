// Extracted from inline <script> in index.html
// Delivery / Pickup toggle styling
const active = ['bg-primary','text-white','border-primary'];
const idle   = ['bg-white','text-slate-900','dark:bg-slate-200','dark:text-slate-900'];
const dBtn = document.getElementById('btnDelivery');
const pBtn = document.getElementById('btnPickup');
function setMode(m){
  if(!dBtn||!pBtn) return;
  if(m==='delivery'){
    dBtn.classList.add(...active); dBtn.classList.remove(...idle);
    pBtn.classList.add(...idle);   pBtn.classList.remove(...active);
  } else {
    pBtn.classList.add(...active); pBtn.classList.remove(...idle);
    dBtn.classList.add(...idle);   dBtn.classList.remove(...active);
  }
  localStorage.setItem('orderMode', m);
}
dBtn?.addEventListener('click', ()=>setMode('delivery'));
pBtn?.addEventListener('click', ()=>setMode('pickup'));
setMode(localStorage.getItem('orderMode') || 'delivery');

// Native carousel helper (basic)
(function(){
  const track = document.querySelector('[data-carousel-track]');
  if(!track) return;
  const dots = Array.from(document.querySelectorAll('[data-carousel-dots] [data-index]'));
  const prevBtn = document.querySelector('[data-carousel-prev]');
  const nextBtn = document.querySelector('[data-carousel-next]');
  const slides = Array.from(track.children);
  function setActive(idx){
    dots.forEach(d=>d.dataset.active = (d.dataset.index == idx));
  }
  function snapTo(idx){
    const el = slides[idx];
    if(el){
      el.scrollIntoView({behavior:'smooth', inline:'start', block:'nearest'});
      setActive(idx);
      current = idx;
    }
  }
  let current = 0;
  dots.forEach(d=>d.addEventListener('click', ()=>snapTo(Number(d.dataset.index))));
  prevBtn?.addEventListener('click', ()=>snapTo((current - 1 + slides.length) % slides.length));
  nextBtn?.addEventListener('click', ()=>snapTo((current + 1) % slides.length));
  let raf;
  track.addEventListener('scroll', ()=>{
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(()=>{
      const scrollLeft = track.scrollLeft;
      const w = track.clientWidth;
      const idx = Math.round(scrollLeft / (w + 12));
      if(idx !== current){ current = idx; setActive(idx); }
    });
  });
  setActive(0);
  let auto = setInterval(()=> nextBtn?.click(), 5000);
  track.addEventListener('pointerdown', ()=>{ clearInterval(auto); auto=null; });
})();
