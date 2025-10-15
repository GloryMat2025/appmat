// ADD into /js/popup-controllers.js (alongside other controllers)
window.PopupControllers = window.PopupControllers || {};

window.PopupControllers['bank-select'] = (dlg, opts, done) => {
  const banks = opts.banks || [];
  const list = dlg.querySelector('[data-bank-list]');
  const search = dlg.querySelector('[data-bank-search]');

  function render() {
    const q = (search.value || '').toLowerCase().trim();
    const items = banks.filter(b => !q || b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q));
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = `<div class="col-span-2 p-4 text-sm text-gray-500">No banks found.</div>`;
      return;
    }
    items.forEach(b => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'w-full rounded-xl ring-1 ring-gray-200 bg-white hover:ring-gray-300 p-3 flex items-center gap-3';
      btn.innerHTML = `
        <div class="w-10 h-10 rounded bg-gray-100 grid place-items-center">🏦</div>
        <div class="text-left">
          <div class="font-medium">${b.name}</div>
          <div class="text-[11px] text-gray-500">${b.code}</div>
        </div>
      `;
      btn.addEventListener('click', ()=> done(b));
      list.appendChild(btn);
    });
  }

  render();
  search.addEventListener('input', render);
  setTimeout(()=> search.focus(), 0);
};

// Product details popup controller
window.PopupControllers['product-details'] = (dlg, opts, done) => {
  // opts should contain product object { id, name, desc, image, price }
  const prod = opts && opts.product ? opts.product : (window.__test_product || {});
  const img = dlg.querySelector('#prodImg');
  const name = dlg.querySelector('#prodName');
  const desc = dlg.querySelector('#prodDesc');
  const price = dlg.querySelector('#prodPrice');
  const add = dlg.querySelector('#addToCart');

  if (img) { img.src = prod.image || '/assets/icons/placeholder.png'; img.alt = prod.name || 'Product'; }
  if (name) name.textContent = prod.name || 'Product';
  if (desc) desc.textContent = prod.desc || prod.short || '';
  if (price) price.textContent = prod.price ? `RM ${prod.price}` : '';

  if (add) {
    add.addEventListener('click', ()=> {
      // Provide a simple done result: { action: 'add', productId }
      done({ action: 'add', productId: prod.id });
    });
  }
  // focus first actionable element
  setTimeout(()=> { if (add) add.focus(); }, 0);
};
