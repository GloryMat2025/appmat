// Simple toast notification system
(function(){
  const MAX = 4;
  const HOLD = 3500;
  let container = document.querySelector('[data-toast-container]');
  if(!container){
    container = document.createElement('div');
    container.dataset.toastContainer = '';
    container.className = 'pointer-events-none fixed z-[999] inset-x-0 bottom-4 flex flex-col items-center gap-2 px-2';
    document.body.appendChild(container);
  }
  const baseClass = 'pointer-events-auto select-none px-4 py-2 rounded-full shadow-md text-sm font-medium tracking-wide flex items-center gap-2 transition-opacity will-change-transform';
  const typeClass = {
    info: 'bg-slate-800/90 text-white backdrop-blur supports-[backdrop-filter]:bg-slate-800/70 dark:bg-slate-700/90',
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white'
  };
  function showToast(message, opts={}){
    if(!message) return;
    const type = opts.type || 'info';
    const el = document.createElement('div');
    el.className = baseClass + ' ' + (typeClass[type] || typeClass.info);
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    if(opts.icon){
      const span = document.createElement('span');
      span.textContent = opts.icon;
      el.appendChild(span);
    }
    const msgNode = document.createElement('span');
    if(opts.html){ msgNode.innerHTML = message; }
    else { msgNode.textContent = message; }
    el.appendChild(msgNode);
    container.appendChild(el);
    while(container.children.length > MAX){ container.firstChild.remove(); }
    // Entrance animation (simple fade/slide)
    el.style.opacity = '0'; el.style.transform = 'translateY(6px)';
    requestAnimationFrame(()=>{ el.style.transition='opacity .18s ease, transform .24s cubic-bezier(.22,.75,.32,1)'; el.style.opacity='1'; el.style.transform='translateY(0)'; });
    const remove = ()=>{
      el.style.opacity='0'; el.style.transform='translateY(6px)';
      setTimeout(()=> el.remove(), 220);
    };
    setTimeout(remove, opts.duration || HOLD);
    el.addEventListener('click', remove);
  }

  // Quantity aggregation helper (debounced per item)
  const qtyBuffer = new Map(); // id -> { name, delta, timer }
  function bufferedQtyToast(id, name, delta){
    if(!id) return;
    let entry = qtyBuffer.get(id);
    if(!entry){ entry = { name, delta:0, timer:null }; qtyBuffer.set(id, entry); }
    entry.name = name || entry.name;
    entry.delta += delta;
    if(entry.timer){ clearTimeout(entry.timer); }
    entry.timer = setTimeout(()=>{
      if(entry.delta !== 0){
        const positive = entry.delta > 0;
          const abs = Math.abs(entry.delta);
          const key = positive
            ? (abs > 1 ? 'toast.cartQtyIncMany' : 'toast.cartQtyInc')
            : (abs > 1 ? 'toast.cartQtyDecMany' : 'toast.cartQtyDec');
          let template = (window.t ? window.t(key) : '{{name}}');
          const msg = template
            .replace('{{name}}', entry.name)
            .replace('{{n}}', String(abs));
          showToast(msg, { type:'info', duration: 1200 + Math.min(1800, abs*150) });
      }
      qtyBuffer.delete(id);
    }, 600); // debounce window
  }

  window.showToast = showToast;
  window.__bufferedQtyToast = bufferedQtyToast;
})();
