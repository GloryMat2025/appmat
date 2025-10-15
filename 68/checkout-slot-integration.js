
/**
 * checkout-slot-integration.js
 * Persists a selected slot for checkout and exposes helpers to compose an order payload.
 *
 * LocalStorage keys:
 *  - orderMode: 'pickup' | 'delivery' (optional, used by other components)
 *  - outletId: selected outlet id
 *  - orderSlot: JSON { atISO, outletId, mode, durationMinutes }
 */
export function persistSelectedSlot(slot){
  if (!slot || !slot.at) return;
  const payload = {
    atISO: slot.at.toISOString(),
    outletId: slot.outletId || null,
    mode: slot.mode || 'pickup',
    durationMinutes: slot.durationMinutes || 30
  };
  localStorage.setItem('orderSlot', JSON.stringify(payload));
  const ev = new CustomEvent('slot:selected', { detail: payload });
  window.dispatchEvent(ev);
  return payload;
}

export function getSelectedSlot(){
  try {
    const raw = localStorage.getItem('orderSlot');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    obj.at = new Date(obj.atISO);
    return obj;
  } catch { return null; }
}

export function clearSelectedSlot(){
  localStorage.removeItem('orderSlot');
  window.dispatchEvent(new CustomEvent('slot:cleared'));
}

export function composeOrderPayload(cart){
  const slot = getSelectedSlot();
  const outletId = localStorage.getItem('outletId') || null;
  const mode = localStorage.getItem('orderMode') || (slot?.mode || 'pickup');
  return {
    cart,
    fulfillment: {
      outletId,
      mode,
      slot: slot ? { start: slot.atISO, durationMinutes: slot.durationMinutes } : null
    }
  };
}

/**
 * Utility that links a checkout button to require a slot selection.
 * It will disable the button and show a tooltip/title until a slot exists.
 */
export function requireSlotForCheckout(btnSelector, bannerSelector){
  const btn = document.querySelector(btnSelector);
  const banner = bannerSelector ? document.querySelector(bannerSelector) : null;
  function update(){
    const has = !!getSelectedSlot();
    if (btn){
      btn.disabled = !has;
      btn.classList.toggle('opacity-50', !has);
      btn.classList.toggle('cursor-not-allowed', !has);
      btn.title = has ? '' : 'Please select a time slot to proceed.';
    }
    if (banner){
      banner.innerHTML = '';
      if (!has){
        const div = document.createElement('div');
        div.className = 'rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm';
        div.textContent = 'Please select a time slot to proceed.';
        banner.appendChild(div);
      }
    }
  }
  window.addEventListener('slot:selected', update);
  window.addEventListener('slot:cleared', update);
  update();
}
