// menu.js — data-driven categories + grid + favorites + search (CSP friendly)
(() => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  // DOM anchors from your existing HTML
  const bar = $('[data-category-bar]');
  const grid = $('[data-products-grid]');
  const skelWrap = $('[data-skeleton-cards]');
  const favoritesBtn = $('[data-favorites-filter]');
  const favEmpty = $('[data-favorites-empty]');
  const searchEmpty = $('[data-search-empty]');
  const searchInput = $('[data-search-input]');

  if (!bar || !grid) return; // Not on home/menu page

  const LS_FAV = 'favorites:v1';
  const loadFav = () => new Set(JSON.parse(localStorage.getItem(LS_FAV) || '[]'));
  const saveFav = (set) => localStorage.setItem(LS_FAV, JSON.stringify([...set]));

  const fmtMY = (n) =>
    new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 2 }).format(n);

  const state = {
    products: [],
    categories: [],
    activeCat: 'all',
    favorites: loadFav(),
    onlyFavs: false,
    q: ''
  };

  // Fetch products
  async function loadProducts() {
    const res = await fetch('/assets/data/products.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load products.json');
    const data = await res.json();
    state.products = Array.isArray(data) ? data : [];
    // Build categories list from data
    const cats = new Set(state.products.map(p => p.category).filter(Boolean));
    state.categories = ['all', ...[...cats].sort()];
  }

  // Render category pills
  function renderCategories() {
    bar.innerHTML = '';
    state.categories.forEach((id) => {
      const label = id === 'all' ? 'Semua' : id.charAt(0).toUpperCase() + id.slice(1);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.dataset.id = id;
      btn.setAttribute('aria-pressed', String(state.activeCat === id));
      btn.className =
        'whitespace-nowrap rounded-2xl px-4 py-2 text-sm border ' +
        (state.activeCat === id
          ? 'bg-black text-white border-black shadow'
          : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50');
      btn.addEventListener('click', () => {
        state.activeCat = id;
        // update pressed states
        $$('.' + 'cat-pill', bar).forEach(x => x.setAttribute('aria-pressed', 'false'));
        renderCategories();
        renderGrid();
      });
      btn.classList.add('cat-pill');
      bar.appendChild(btn);
    });
  }

  // Card builder
  function cardEl(p) {
    const article = document.createElement('article');
    article.className = 'group rounded-2xl ring-1 ring-gray-200 bg-white overflow-hidden hover:shadow-md transition';
    article.setAttribute('data-id', p.id);
    article.setAttribute('data-cat', p.category || 'uncat');

    // Image
    const imgBox = document.createElement('div');
    imgBox.className = 'aspect-square w-full overflow-hidden bg-gray-100';
    const img = document.createElement('img');
    img.src = p.img;
    img.alt = p.name;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.className = 'h-full w-full object-cover group-hover:scale-105 transition';
    imgBox.appendChild(img);

    // Body
    const body = document.createElement('div');
    body.className = 'p-3';
    const title = document.createElement('h3');
    title.className = 'font-semibold leading-snug line-clamp-2';
    title.textContent = p.name;

    const meta = document.createElement('div');
    meta.className = 'mt-1 text-sm text-gray-500 capitalize';
    meta.textContent = p.category;

    const price = document.createElement('div');
    price.className = 'mt-2 font-semibold';
    price.textContent = fmtMY(p.price);

    // Fav toggle
    const fav = document.createElement('button');
    fav.type = 'button';
    fav.setAttribute('aria-label', 'Tambah ke kegemaran');
    fav.dataset.fav = p.id;
    const isFav = state.favorites.has(p.id);
    fav.setAttribute('aria-pressed', String(isFav));
    fav.className =
      'mt-2 text-[12px] px-2 py-1 rounded-lg ring-1 ' +
      (isFav ? 'ring-rose-300 bg-rose-50 text-rose-700' : 'ring-gray-300 text-gray-700 bg-white');
    fav.textContent = isFav ? '★ Kegemaran' : '☆ Kegemaran';

    // Tags (optional)
    if (Array.isArray(p.tags) && p.tags.length) {
      const tags = document.createElement('div');
      tags.className = 'mt-2 flex flex-wrap gap-1';
      p.tags.forEach(t => {
        const sp = document.createElement('span');
        sp.className = 'text-[11px] rounded-full bg-gray-100 px-2 py-0.5';
        sp.textContent = t;
        tags.appendChild(sp);
      });
      body.appendChild(tags);
    }

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(price);
    body.appendChild(fav);

    article.appendChild(imgBox);
    article.appendChild(body);

    return article;
  }

  function applyFilters(list) {
    let out = list;

    if (state.activeCat !== 'all') {
      out = out.filter(p => p.category === state.activeCat);
    }
    if (state.onlyFavs) {
      out = out.filter(p => state.favorites.has(p.id));
    }
    if (state.q) {
      const q = state.q.toLowerCase();
      out = out.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return out;
  }

  function renderGrid() {
    // first render: remove skeleton
    if (skelWrap) skelWrap.remove();

    const items = applyFilters(state.products);
    grid.innerHTML = '';
    items.forEach(p => grid.appendChild(cardEl(p)));

    // Empty states
    const noneFav = state.onlyFavs && items.length === 0;
    const noneSearch = state.q && items.length === 0;
    favEmpty?.classList.toggle('hidden', !noneFav);
    searchEmpty?.classList.toggle('hidden', !noneSearch);
  }

  // Events
  favoritesBtn?.addEventListener('click', () => {
    const active = favoritesBtn.dataset.active === 'true';
    favoritesBtn.dataset.active = String(!active);
    favoritesBtn.setAttribute('aria-pressed', String(!active));
    favoritesBtn.classList.toggle('bg-blue-600', !active);
    favoritesBtn.classList.toggle('text-white', !active);
    state.onlyFavs = !active;
    renderGrid();
  });

  searchInput?.addEventListener('input', () => {
    state.q = searchInput.value.trim();
    renderGrid();
  });

  // Delegate fav toggle
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fav]');
    if (!btn) return;
    const id = btn.dataset.fav;
    const nowFav = !state.favorites.has(id);
    if (nowFav) state.favorites.add(id);
    else state.favorites.delete(id);
    saveFav(state.favorites);
    // update button
    btn.setAttribute('aria-pressed', String(nowFav));
    btn.textContent = nowFav ? '★ Kegemaran' : '☆ Kegemaran';
    btn.className =
      'mt-2 text-[12px] px-2 py-1 rounded-lg ring-1 ' +
      (nowFav ? 'ring-rose-300 bg-rose-50 text-rose-700' : 'ring-gray-300 text-gray-700 bg-white');
    // if we're in Only Favorites, re-render to hide removed items
    if (state.onlyFavs && !nowFav) renderGrid();
  });

  // Boot
  (async function init() {
    try {
      await loadProducts();
      renderCategories();
      renderGrid();
    } catch (err) {
      console.error(err);
      if (grid) grid.innerHTML = '<div class="col-span-2 text-xs text-rose-600">Gagal memuatkan produk.</div>';
    }
  })();
})();
