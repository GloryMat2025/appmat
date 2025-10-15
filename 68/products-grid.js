(function(){
  function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&"'<>]/g, function(s){ return ({'&':'&amp;','"':'&quot;','\'':'&#39;','<':'&lt;','>':'&gt;'})[s]; }); }
  async function loadJSON(url){ const r = await fetch(url); if(!r.ok) return []; return r.json(); }
  function loadFragment(path){ return fetch(path).then(r=> r.ok? r.text(): ''); }

  async function render(){
    const grid = document.querySelector('[data-products-grid]');
    if(!grid) return;
    const data = await loadJSON('/data/products.json');
    const frag = await loadFragment('/popups/product-card.html');
    grid.innerHTML = '';
    data.forEach(p=>{
      // normalize fields: some fixtures use `img`, some `image`; name may be localized object
      const image = p.img || p.image || 'assets/images/products/placeholder.jpg';
      const name = (typeof p.name === 'string') ? p.name : (p.name && (p.name.en || p.name.en_US || Object.values(p.name)[0])) || 'Product';
      const short = p.short || (p.description && (typeof p.description === 'string' ? p.description : p.description.en)) || '';
      const price = (p.price != null) ? Number(p.price).toFixed(2) : '';

      let html = frag.replace(/{{id}}/g,p.id)
                     .replace(/{{image}}/g,image)
                     .replace(/{{name}}/g,escapeHtml(name))
                     .replace(/{{short}}/g,escapeHtml(short))
                     .replace(/{{price}}/g,price);
      const wrapper = document.createElement('div'); wrapper.innerHTML = html;
      const el = wrapper.firstElementChild;
      grid.appendChild(el);
      // wire card-level qty controls and Add button
      const qtyInput = el.querySelector('.qty-input');
      const qtyInc = el.querySelector('.qty-inc');
      const qtyDec = el.querySelector('.qty-dec');
      const addBtnCard = el.querySelector('[data-action="add"]');
  if(qtyInc) qtyInc.addEventListener('click', ()=> { try{ qtyInput.value = Math.min(99, Number(qtyInput.value||1)+1); }catch(e){ void e; } });
  if(qtyDec) qtyDec.addEventListener('click', ()=> { try{ qtyInput.value = Math.max(1, Number(qtyInput.value||1)-1); }catch(e){ void e; } });
      if(addBtnCard){ addBtnCard.addEventListener('click', (ev)=>{
        ev.preventDefault();
        const qty = Number(qtyInput?.value||1) || 1;
        const item = { id: p.id, name: name, price: Number(p.price||0), qty };
        try{
          if (window.appAPI && typeof window.appAPI.addToCart === 'function') { window.appAPI.addToCart(item); }
          else {
            const key = 'cartItems'; const items = JSON.parse(localStorage.getItem(key)||'[]'); const idx = items.findIndex(i=>i.id===item.id);
            if (idx>=0) items[idx].qty = (items[idx].qty||0) + qty; else items.push(item);
            localStorage.setItem(key, JSON.stringify(items));
      try{ if (typeof window.updateCartBadge === 'function') window.updateCartBadge(); }catch(e){ void e; }
          }
          if (typeof window.showToast === 'function') window.showToast('Added to cart!');
        }catch(e){ console.warn('add from card failed', e); }
      }); }
      // wire click to open popup using global openPopup or fallback
      el.querySelector('[data-modal-target]')?.addEventListener('click', async (e)=>{
        e.preventDefault();
        const target = e.currentTarget.getAttribute('data-modal-target');
        const pid = e.currentTarget.getAttribute('data-product-id');
        const product = data.find(x=>x.id===pid);
        if (typeof window.openPopup === 'function') {
          await window.openPopup(target, { product });
        } else if (typeof window.PopupControllers === 'object' && typeof window.PopupControllers[target] === 'function') {
          // create a temporary container and call controller directly
          const fragText = await loadFragment(`/popups/${target}.html`);
          const div = document.createElement('div'); div.innerHTML = fragText; document.body.appendChild(div);
          await new Promise((res)=> window.PopupControllers[target](div, { product }, (r)=>{ res(r); div.remove(); }));
        } else {
          // Fallback: inject popup fragment into the appDialog if present
          const fragText = await loadFragment(`/popups/${target}.html`);
          const appDialog = document.getElementById('appDialog');
          if (appDialog) {
            const body = appDialog.querySelector('[data-modal-body]');
            if (body) {
              body.innerHTML = fragText;
              // populate expected fields (#prodImg, #prodName, #prodDesc, #prodPrice)
              const img = body.querySelector('#prodImg'); if (img) { img.src = product.img || product.image || ''; img.alt = (product.name && (typeof product.name === 'string' ? product.name : (product.name.en || Object.values(product.name)[0] || ''))) ; }
              const nm = body.querySelector('#prodName'); if (nm) nm.textContent = (typeof product.name === 'string') ? product.name : (product.name && (product.name.en || Object.values(product.name)[0])) || '';
              const desc = body.querySelector('#prodDesc'); if (desc) desc.textContent = (product.description && (typeof product.description === 'string' ? product.description : product.description.en)) || product.short || '';
              const price = body.querySelector('#prodPrice'); if (price) price.textContent = product.price ? `RM ${Number(product.price).toFixed(2)}` : '';
              const addBtn = body.querySelector('#addToCart');
              if (addBtn) {
                  addBtn.addEventListener('click', ()=>{
                    // prefer app API
                    try{
                      const item = { id: product.id, name: (typeof product.name === 'string') ? product.name : (product.name && (product.name.en || Object.values(product.name)[0])) || '', price: Number(product.price||0), qty: 1 };
                      if (window.appAPI && typeof window.appAPI.addToCart === 'function') {
                        window.appAPI.addToCart(item);
                      } else {
                        // fallback to localStorage key used by app: 'cartItems'
                        try{
                          const key = 'cartItems';
                          const items = JSON.parse(localStorage.getItem(key)||'[]');
                          const idx = items.findIndex(i=>i.id===item.id);
                          if (idx>=0) { items[idx].qty = (items[idx].qty||0)+1; } else { items.push(item); }
                          localStorage.setItem(key, JSON.stringify(items));
                          // notify other UI
                          try{ if (typeof window.updateCartBadge === 'function') window.updateCartBadge(); }catch(e){ void e; }
                        }catch(e){ void e; }
                      }
                      if (typeof window.showToast === 'function') window.showToast('Added to cart!');
                    }catch(e){ console.warn('add to cart failed', e); }
                    // clear content then close dialog
                    try { body.innerHTML = ''; } catch(e){ void e; }
                    try { if (typeof appDialog.close === 'function') appDialog.close(); else appDialog.classList.add('hidden'); } catch(e){ void e; }
                  });
                }
              // ensure body is cleared when dialog is closed by other means
              if (!appDialog.__clearHandlerAttached) {
                appDialog.addEventListener('close', ()=>{ try{ const b = appDialog.querySelector('[data-modal-body]'); if(b) b.innerHTML=''; }catch(e){ void e; } });
                appDialog.__clearHandlerAttached = true;
              }
              try { if (typeof appDialog.showModal === 'function') appDialog.showModal(); else appDialog.classList.remove('hidden'); } catch(e){ appDialog.classList.remove('hidden'); }
            }
          } else {
            console.warn('No popup loader or dialog found for', target);
          }
        }
      });
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') render(); else document.addEventListener('DOMContentLoaded', render);
})();