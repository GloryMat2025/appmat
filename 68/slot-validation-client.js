
/**
 * slot-validation-client.js
 * Validate the currently selected slot with the server before finalizing checkout.
 *
 * Usage:
 * <script type="module">
 *   import { validateSelectedSlot } from "/assets/js/slot-validation-client.js";
 *   const ok = await validateSelectedSlot({ outletId, mode, startISO, durationMinutes });
 * </script>
 */

import { getCartCategories } from '/assets/js/cart-categories.js';

export async function validateSelectedSlot({ outletId=null, mode='pickup', startISO, durationMinutes=30, endpoint='/api/validate-slot' }){
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000); // 8s timeout
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outletId, mode, startISO, durationMinutes, categories: getCartCategories() }),
      signal: ctrl.signal,
      credentials: 'include'
    });
    clearTimeout(t);
    const data = await res.json().catch(()=>({ ok:false, error:'Bad JSON' }));
    if (!res.ok) return { ok:false, error: data.error || 'Validation failed' };
    return data;
  } catch (e) {
    clearTimeout(t);
    return { ok:false, error: 'Network/timeout during validation' };
  }
}

/**
 * Helper that binds a button and banner to do validation before proceeding.
 * Requires that the slot has been persisted to localStorage('orderSlot') by checkout-slot-integration.js.
 */
export function bindValidationToCheckout({ btnSelector, bannerSelector, endpoint='/api/validate-slot' }){
  const btn = document.querySelector(btnSelector);
  const banner = bannerSelector ? document.querySelector(bannerSelector) : null;
  function showBanner(kind, msg){
    if (!banner) return;
    banner.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'rounded-lg border p-3 text-sm ' + (kind==='ok' ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-800');
    div.textContent = msg;
    banner.appendChild(div);
  }
  async function onClick(e){
    // pull slot + context from localStorage, as used by the other modules
    const slotRaw = localStorage.getItem('orderSlot');
    if (!slotRaw){ showBanner('warn','No slot selected.'); e.preventDefault(); return; }
    const slot = JSON.parse(slotRaw);
    const outletId = localStorage.getItem('outletId') || null;
    const mode = localStorage.getItem('orderMode') || (slot.mode || 'pickup');
    const resp = await validateSelectedSlot({ outletId, mode, startISO: slot.atISO, durationMinutes: slot.durationMinutes || 30, endpoint });
    if (!resp.ok){
      showBanner('warn', resp.reason || resp.error || 'Slot not valid now.');
      e.preventDefault();
      return;
    }
    showBanner('ok', 'Slot validated. You can proceed.');
    // let the normal click flow continue (e.g. form submit or JS handler)
  }
  if (btn){
    btn.addEventListener('click', onClick);
  }
}
