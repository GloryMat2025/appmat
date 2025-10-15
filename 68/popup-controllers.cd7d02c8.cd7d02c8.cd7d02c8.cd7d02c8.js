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
