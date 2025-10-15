// delivery.js — saved addresses (localStorage) + validate + default + edit + redirect
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const list = $('#savedList');
  const rowTpl = $('#savedRow');
  const savedEmpty = $('#savedEmpty');
  const clearAll = $('#clearAll');

  const form = document.getElementById('addressForm');
  const f = {
    label: $('#label'),
    addr1: $('#addr1'),
    addr2: $('#addr2'),
    city: $('#city'),
    state: $('#state'),
    postcode: $('#postcode'),
    save: $('#save'),
    makeDefault: $('#makeDefault'),
    hiddenAddr: $('#addressHidden'),
    hiddenLabel: $('#addressLabelHidden')
  };

  const err = {
    addr1: $('#err-addr1'),
    city: $('#err-city'),
    postcode: $('#err-postcode')
  };

  const LS_KEY = 'savedAddresses:v2'; // bump version for new shape
  const load = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } };
  const save = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));

  // Helpers
  const compose = () => {
    const parts = [f.addr1.value.trim(), f.addr2.value.trim(), f.city.value.trim(), f.state.value.trim(), f.postcode.value.trim()].filter(Boolean);
    return parts.join(', ');
  };

  const validate = () => {
    let ok = true;
    const show = (el, on) => el && el.classList.toggle('hidden', !on);
    if (!f.addr1.value.trim()) { show(err.addr1, true); ok = false; } else show(err.addr1, false);
    if (!f.city.value.trim())  { show(err.city, true);  ok = false; } else show(err.city, false);
    if (!/^\d{5}$/.test(f.postcode.value.trim())) { show(err.postcode, true); ok = false; } else show(err.postcode, false);
    return ok;
  };

  // Render saved list
  function renderSaved() {
    const items = load();
    list.innerHTML = '';
    savedEmpty.classList.toggle('hidden', items.length > 0);

    items.forEach((it, idx) => {
      const li = rowTpl.content.cloneNode(true);
      $('.label', li).textContent = it.label || 'Alamat';
      $('.address', li).textContent = it.address;
      if (it.isDefault) $('.defaultBadge', li)?.classList.remove('hidden');

      // Use
      $('.use', li).addEventListener('click', () => {
        const url = new URL('/index.html', location.origin);
        url.searchParams.set('address', it.address);
        if (it.label) url.searchParams.set('addressLabel', it.label);
        location.href = url.toString();
      });

      // Edit (prefill form)
      $('.edit', li).addEventListener('click', () => {
        f.label.value = it.label || '';
        const parts = it.address.split(',').map(s => s.trim());
        // naive split back; user can refine
        f.addr1.value = parts[0] || '';
        f.addr2.value = (parts.length > 4 ? parts.slice(1, parts.length - 3).join(', ') : parts[1] || '');
        f.city.value  = parts[parts.length - 3] || '';
        f.state.value = parts[parts.length - 2] || '';
        f.postcode.value = parts[parts.length - 1] || '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      // Set default
      $('.star', li).addEventListener('click', () => {
        const arr = load().map((x, i) => ({ ...x, isDefault: i === idx }));
        save(arr);
        renderSaved();
      });

      // Delete
      $('.del', li).addEventListener('click', () => {
        const arr = load();
        arr.splice(idx, 1);
        save(arr);
        renderSaved();
      });

      list.appendChild(li);
    });
  }

  clearAll?.addEventListener('click', () => { save([]); renderSaved(); });
  renderSaved();

  // Live validation (UX)
  ['input', 'change'].forEach(evt => {
    f.addr1.addEventListener(evt, validate);
    f.city.addEventListener(evt, validate);
    f.postcode.addEventListener(evt, validate);
  });

  // Submit → compose + optional save + redirect with query params
  form?.addEventListener('submit', (e) => {
    if (!validate()) {
      e.preventDefault();
      return;
    }

    const composed = compose();
    const label = f.label.value.trim();

    f.hiddenAddr.value = composed;
    if (label) f.hiddenLabel.value = label;

    if (f.save?.checked) {
      // if makeDefault is checked, mark this one default and clear others
      const arr = load();
      const entry = {
        id: crypto?.randomUUID?.() || String(Date.now()),
        label,
        address: composed,
        isDefault: !!f.makeDefault?.checked,
        createdAt: Date.now()
      };
      let next = [entry, ...arr];
      if (entry.isDefault) next = next.map((x, i) => (i === 0 ? x : { ...x, isDefault: false }));
      save(next.slice(0, 20));
    }
    // allow form to continue GET → index.html?address=...
  });
})();
