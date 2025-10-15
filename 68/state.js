// /js/state.js
(function () {
  const LS_CART = 'cart:items';   // [{id,name,price,qty}]
  const currency = (n) => `RM ${n.toFixed(2)}`;

  const CartState = {
    get() {
      try { return JSON.parse(localStorage.getItem(LS_CART) || '[]'); }
      catch { return []; }
    },
    save(items) {
      localStorage.setItem(LS_CART, JSON.stringify(items));
      return items;
    },
    add(item) {
      const items = this.get();
      const i = items.findIndex(x => x.id === item.id);
      if (i >= 0) items[i].qty += item.qty || 1;
      else items.push({ ...item, qty: item.qty || 1 });
      return this.save(items);
    },
    updateQty(id, qty) {
      let items = this.get();
      items = items.map(x => x.id === id ? { ...x, qty: Math.max(1, qty) } : x);
      return this.save(items);
    },
    remove(id) {
      const items = this.get().filter(x => x.id !== id);
      return this.save(items);
    },
    clear() { return this.save([]); },
    subtotal() {
      return this.get().reduce((s, x) => s + x.price * x.qty, 0);
    },
    count() {
      return this.get().reduce((s, x) => s + x.qty, 0);
    },
    fmt: currency
  };

  // seed demo (remove in prod)
  if (CartState.get().length === 0) {
    CartState.save([
      { id: 'nasi-lemak', name: 'Nasi Lemak', price: 6.90, qty: 1 },
      { id: 'teh-ais', name: 'Teh Ais', price: 3.50, qty: 2 }
    ]);
  }

  window.CartState = CartState;
})();
