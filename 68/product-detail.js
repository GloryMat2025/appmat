// product-detail.js — bind clicks on product cards to open detail drawer
/* eslint-disable no-unused-vars */
// Configurable data URLs
const DATA_URL = 'products_min.json';   // your products.json
const CAT_URL = 'categories.json';
const PRICEBOOK_URL = 'pricebook.csv';
const INVENTORY_URL = 'inventory.csv';

(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const grid = document.querySelector('[data-products-grid]');
  if (!grid) return;

  // Drawer elements
  const root = $('#pd');
  const img = $('[data-pd-img]', root);
  const name = $('[data-pd-name]', root);
  const cat = $('[data-pd-cat]', root);
  const desc = $('[data-pd-desc]', root);
  const price = $('[data-pd-price]', root);
  const addBtn = $('[data-pd-add]', root);
  const closeBtn = $('[data-pd-close]', root);
  const backdrop = $('[data-pd-backdrop]', root);

  let products = null;
  let lastOpener = null;
  const fmtMY = (n) => new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(n);

  async function ensureProducts() {
    if (products) return products;
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    products = await res.json();
    return products;
  }

  function show(opener) {
    root.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // Focus management
    const focusEl = root.querySelector('[tabindex="-1"]') || closeBtn;
    setTimeout(() => focusEl && focusEl.focus(), 10);
    lastOpener = opener || null;
  }
  function hide() {
    root.classList.add('hidden');
    document.body.style.overflow = '';
    if (lastOpener) setTimeout(() => lastOpener.focus(), 10);
  }

  async function openFor(id, opener) {
    const list = await ensureProducts();
    const p = list.find(x => x.id === id);
    if (!p) return;

  const lang = localStorage.getItem('lang') || 'en';
  img.src = Array.isArray(p.images) ? p.images[0] : p.img || '';
  img.alt = lang === 'bm' ? (p.name_bm || p.name_en) : (p.name_en || p.name_bm);
  img.loading = 'lazy'; img.decoding = 'async';
  name.textContent = lang === 'bm' ? (p.name_bm || p.name_en) : (p.name_en || p.name_bm);
  cat.textContent = p.category_id || p.category || '';
  desc.textContent = lang === 'bm' ? (p.long_desc_bm || p.short_desc_bm || p.long_desc_en || p.short_desc_en) : (p.long_desc_en || p.short_desc_en || p.long_desc_bm || p.short_desc_bm);
  price.textContent = fmtMY(p.base_price || p.price);
  addBtn.onclick = () => { window.Cart?.add(p, 1); hide(); };

    show(opener);
  }

  // Delegate clicks on any [data-product-open] button (for accessibility)
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-product-open]');
    if (btn) {
      openFor(btn.getAttribute('data-product-open'), btn);
      return;
    }
    // Fallback: click on card
    const card = e.target.closest('article.group[data-id], article[data-id]');
    if (card) openFor(card.getAttribute('data-id'), card);
  });

  // Keyboard accessibility: open on Enter/Space
  grid.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-product-open]')) {
      e.preventDefault();
      openFor(e.target.getAttribute('data-product-open'), e.target);
    }
  });

  // Close handlers
  closeBtn?.addEventListener('click', hide);
  backdrop?.addEventListener('click', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !root.classList.contains('hidden')) hide(); });
})();
