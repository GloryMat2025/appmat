
// cart.js — tiny cart store using localStorage
(() => {
  const LS_KEY = 'cart:v1';

  const read = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
    catch { return []; }
  };
  const write = (items) => localStorage.setItem(LS_KEY, JSON.stringify(items));

  const sumQty = (items) => items.reduce((n, it) => n + (it.qty || 0), 0);

  const Cart = {
    add(product, qty = 1) {
      const items = read();
      const idx = items.findIndex(x => x.id === product.id);
      if (idx >= 0) items[idx].qty += qty;
      else items.unshift({ id: product.id, name: product.name, price: product.price, img: product.img, qty });
      write(items);
      this.syncBadge();
    },
    remove(id) {
      write(read().filter(x => x.id !== id));
      this.syncBadge();
    },
    setQty(id, qty) {
      const items = read();
      const it = items.find(x => x.id === id);
      if (it) { it.qty = qty; write(items); }
      this.syncBadge();
    },
    clear() { write([]); this.syncBadge(); },
    items: read,
    count() { return sumQty(read()); },

    // UI
    initBadge(selector = '[data-cart-badge]') {
      this._badge = document.querySelector(selector);
      this.syncBadge();
    },
    syncBadge() {
      const b = this._badge || document.querySelector('[data-cart-badge]');
      if (!b) return;
      const n = this.count();
      b.textContent = String(n);
      b.classList.toggle('hidden', n <= 0);
    }
  };

  // expose for other scripts
  window.Cart = Cart;

  // init on load
  window.addEventListener('DOMContentLoaded', () => Cart.initBadge());
})();
