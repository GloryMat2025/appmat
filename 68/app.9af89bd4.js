/* ---------- Default address badge on Home (when no query) ---------- */
(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('address')) return; // query takes precedence

  const badge = document.querySelector('[data-address-badge]');
  const text = document.querySelector('[data-address-text]');
  const clear = document.querySelector('[data-address-clear]');
  if (!badge || !text || !clear) return;

  let saved = [];
  try { saved = JSON.parse(localStorage.getItem('savedAddresses:v2') || '[]'); } catch {}
  const def = saved.find(x => x.isDefault);
  if (!def) return;

  badge.classList.remove('hidden');
  text.textContent = def.label ? `${def.label}: ${def.address}` : def.address;
  clear.addEventListener('click', () => {
    // clearing here = just hide on home; keep default for later visits
    badge.classList.add('hidden');
    history.replaceState({}, '', location.pathname);
  });
})();
