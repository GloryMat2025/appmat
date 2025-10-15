// cart-page.js — render items & totals using Cart API
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const list = $('#list');
  const rowTpl = $('#row');
  const totalEl = $('#total');
  const fmtMY = (n) => new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(n);

  function render() {
    const items = window.Cart.items();
    list.innerHTML = '';
    let total = 0;

    items.forEach(it => {
      total += it.price * it.qty;
      const row = rowTpl.content.cloneNode(true);
      const img = row.querySelector('img');
      img.src = it.img; img.alt = it.name;

      row.querySelector('.name').textContent = it.name;
      row.querySelector('.price').textContent = `${fmtMY(it.price)} × ${it.qty}`;
      row.querySelector('.qty').textContent = it.qty;

      row.querySelector('.inc').addEventListener('click', () => { window.Cart.setQty(it.id, it.qty + 1); render(); });
      row.querySelector('.dec').addEventListener('click', () => {
        const q = Math.max(0, it.qty - 1);
        if (q === 0) window.Cart.remove(it.id); else window.Cart.setQty(it.id, q);
        render();
      });

      list.appendChild(row);
    });

    totalEl.textContent = fmtMY(total);
  }

  $('#clear').addEventListener('click', () => { window.Cart.clear(); render(); });
  $('#checkout').addEventListener('click', () => alert('Demo checkout'));

  window.addEventListener('DOMContentLoaded', render);
})();
