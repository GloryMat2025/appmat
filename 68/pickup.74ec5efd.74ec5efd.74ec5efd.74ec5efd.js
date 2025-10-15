// pickup.js — render outlets + live search + navigate back to index.html with query params
(async () => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const list = $('#list');
  const rowTpl = $('#row');
  const q = $('#q');
  const count = $('#count');

  async function load() {
    const res = await fetch('../data/outlets.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Fail fetch outlets.json');
    return res.json();
  }

  const outlets = await load();
  let view = outlets.slice();

  function render(items) {
    list.innerHTML = '';
    items.forEach(o => {
      const li = rowTpl.content.cloneNode(true);
      $('.name', li).textContent = o.name;
      $('.address', li).textContent = o.address || '';
      $('.state', li).textContent = o.state ? `Negeri: ${o.state}` : '';
      $('.hours', li).textContent = o.openHours ? `Waktu: ${o.openHours}` : '';

      $('button', li).addEventListener('click', () => {
        const url = new URL('/index.html', location.origin);
        url.searchParams.set('outlet', o.id);
        url.searchParams.set('outletName', o.name);
        location.href = url.toString();
      });
      list.appendChild(li);
    });
    count.textContent = `${items.length} cawangan dipaparkan`;
  }

  function filter(term) {
    if (!term) return outlets;
    const t = term.toLowerCase();
    return outlets.filter(o =>
      (o.name && o.name.toLowerCase().includes(t)) ||
      (o.address && o.address.toLowerCase().includes(t)) ||
      (o.state && o.state.toLowerCase().includes(t))
    );
  }

  q.addEventListener('input', () => {
    view = filter(q.value);
    render(view);
  });

  render(view);
})();
