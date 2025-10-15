// /js/checkout.js
(/* eslint-disable no-unused-vars */
function(){
  const fmt = window.CartState.fmt;
  // Elements
  const els = {
    list: document.getElementById('sumList'),
    subtotal: document.getElementById('sumSubtotal'),
    itemsCount: document.getElementById('sumItemsCount'),
    bankChosen: document.getElementById('bankChosen'),
    btnChooseBank: document.getElementById('btnChooseBank'),
    form: document.getElementById('checkoutForm'),
    btnApplyPromo: document.getElementById('btnApplyPromo'),
    btnClearPromo: document.getElementById('btnClearPromo'),
    promoApplied: document.getElementById('promoApplied'),
    live: document.getElementById('checkoutLive'),
    pay: document.getElementById('btnPay'),
    tSubtotal: document.getElementById('tSubtotal'),
    tDiscount: document.getElementById('tDiscount'),
    tTax: document.getElementById('tTax'),
    tDelivery: document.getElementById('tDelivery'),
    tTotal: document.getElementById('tTotal'),
    rowDiscount: document.getElementById('rowDiscount'),
    rowDelivery: document.getElementById('rowDelivery')
  };

  // Promo config (demo)
  const PROMOS = {
    'WELCOME10': { type:'percent', value:10, desc:'10% off first order' },
    'FREEDRINK': { type:'flat', value:3.50, desc:'Free drink value RM 3.50' }
  };
  const TAX_RATE = 0.06;
  const DELIVERY_FEE = 4.00; // only if fulfilment detected as delivery
  const LS_BANK = 'checkout:bank';
  const LS_PROMO = 'checkout:promo';
  const LS_DRAFT = 'checkout:draft:v1';

  function readDraft(){ try { return JSON.parse(localStorage.getItem(LS_DRAFT)||'{}'); } catch (e) { void e; return {}; } }
  function saveDraft(){ if(!els.form) return; const fd = new FormData(els.form); const data={}; fd.forEach((v,k)=> data[k]=String(v)); localStorage.setItem(LS_DRAFT, JSON.stringify(data)); }

  // Load saved bank
  const savedBank = JSON.parse(localStorage.getItem(LS_BANK) || 'null');
  if(savedBank) els.bankChosen.textContent = savedBank.name;

  // Restore draft
  const draft = readDraft();
  if(els.form && draft){ ['name','email','phone','notes'].forEach(f=>{ if(draft[f] && els.form.elements[f]) els.form.elements[f].value = draft[f]; }); if(draft.promo && els.form.elements['promo']) els.form.elements['promo'].value=draft.promo; }

  // Selected fulfilment detection (from earlier code's LS keys)
  const outl = JSON.parse(localStorage.getItem('gf_pickup_outlet') || 'null');
  const addr = JSON.parse(localStorage.getItem('gf_delivery_address') || 'null');
  const fulfilment = outl ? 'pickup' : (addr ? 'delivery':'unspecified');

  // Helpers
  function announce(msg){ if(els.live){ els.live.textContent=''; setTimeout(()=>{ els.live.textContent=msg; },10);} }
  function setError(field, on){
    const err = document.querySelector(`[data-err-for="${field}"]`); const input = els.form?.elements[field];
    if(err && input){ err.classList.toggle('hidden', !on); input.setAttribute('aria-invalid', on?'true':'false'); }
  }
  function validate(){ if(!els.form) return false; let ok=true; ['name','email','phone'].forEach(f=>{ const el = els.form.elements[f]; const valid = !!el.value && (el.checkValidity? el.checkValidity():true); setError(f, !valid); if(!valid) ok=false; }); return ok; }

  function getPromo(){ const code = (localStorage.getItem(LS_PROMO)||'').toUpperCase(); if(code && PROMOS[code]) return { code, ...PROMOS[code] }; return null; }
  function applyPromo(code){ const up = code.toUpperCase(); if(PROMOS[up]){ localStorage.setItem(LS_PROMO, up); return PROMOS[up]; } return null; }
  function clearPromo(){ localStorage.removeItem(LS_PROMO); }

  function computeTotals(){
    const items = window.CartState.get();
    const subtotal = window.CartState.subtotal();
    const promo = getPromo();
    let discount=0;
    if(promo){
      if(promo.type==='percent') discount = subtotal * (promo.value/100);
      else if(promo.type==='flat') discount = Math.min(subtotal, promo.value);
    }
    // Loyalty discount applied after promo but before tax
    let loyaltyPointsApplied = 0; let loyaltyRM = 0;
    if(window.Loyalty){
      // Recompute max redeemable with current subtotal after promo
      const subtotalAfterPromo = Math.max(0, subtotal - discount);
      const appliedPts = window.Loyalty.applied();
      const maxAllowed = (function(){
        const LOYALTY_REDEEM_RATE = 100; // keep in sync (cannot import easily here)
        const maxCurrency = subtotalAfterPromo;
        const maxPointsBySubtotal = Math.floor(maxCurrency * LOYALTY_REDEEM_RATE);
        return Math.min(appliedPts, maxPointsBySubtotal);
      })();
      loyaltyPointsApplied = maxAllowed;
      loyaltyRM = +(loyaltyPointsApplied / 100).toFixed(2);
    }
    const taxable = Math.max(0, subtotal - discount - loyaltyRM);
    const tax = +(taxable * TAX_RATE).toFixed(2);
    const delivery = fulfilment==='delivery' ? DELIVERY_FEE : 0;
    const total = +(taxable + tax + delivery).toFixed(2);
    return { items, subtotal, discount:+discount.toFixed(2), tax, delivery, total, promo, loyalty:{ points: loyaltyPointsApplied, amount: loyaltyRM } };
  }

  function renderSummary(){
  const { items, subtotal, promo, discount, tax, delivery, total, loyalty } = computeTotals();
    els.list.innerHTML = items.map(x=>`<div class="flex items-center justify-between text-sm"><span class="truncate">${x.name} × ${x.qty}</span><span class="font-medium">${fmt(x.qty*x.price)}</span></div>`).join('');
    els.subtotal.textContent = fmt(subtotal);
    if(els.itemsCount) els.itemsCount.textContent = `${items.reduce((s,x)=>s+x.qty,0)} item(s)`;
    els.tSubtotal.textContent = fmt(subtotal);
    els.tTax.textContent = fmt(tax);
    els.tTotal.textContent = fmt(total);
    els.tDelivery.textContent = fmt(delivery);
    els.rowDelivery.hidden = delivery===0;
    if(promo){
      els.rowDiscount.hidden = false;
      els.tDiscount.textContent = `− ${fmt(discount)}`;
      els.promoApplied.classList.remove('hidden');
      els.promoApplied.textContent = `${promo.code} applied: ${promo.desc}`;
      els.btnClearPromo.classList.remove('hidden');
    } else {
      els.rowDiscount.hidden = true;
      els.promoApplied.classList.add('hidden');
      els.btnClearPromo.classList.add('hidden');
    }
    // Inject loyalty line dynamically (after promo discount row or subtotal) if applied
    let loyaltyRow = document.getElementById('rowLoyalty');
    if(loyalty && loyalty.points>0){
      if(!loyaltyRow){
        loyaltyRow = document.createElement('div');
        loyaltyRow.id = 'rowLoyalty';
        loyaltyRow.className = 'flex items-center justify-between text-sm mt-1';
        els.tTotal.parentElement?.insertBefore(loyaltyRow, els.tTax.parentElement); // before tax row
      }
      loyaltyRow.innerHTML = `<span>Loyalty (−${loyalty.points}pts)</span><span class="font-medium">− ${fmt(loyalty.amount)}</span>`;
    } else if(loyaltyRow){ loyaltyRow.remove(); }
  }

  // Initial render
  renderSummary();

  // Promo events
  els.btnApplyPromo?.addEventListener('click', ()=>{
    const code = els.form.elements['promo'].value.trim();
    const applied = applyPromo(code);
    setError('promo', !applied && !!code);
    if(applied){ announce(`Promo ${code} applied`); }
    renderSummary();
    saveDraft();
  });
  els.btnClearPromo?.addEventListener('click', ()=>{ clearPromo(); els.form.elements['promo'].value=''; renderSummary(); announce('Promo removed'); saveDraft(); });

  els.form?.addEventListener('input', (e)=>{ if(['name','email','phone','notes','promo'].includes(e.target.name)){ saveDraft(); if(['name','email','phone'].includes(e.target.name)) setError(e.target.name, false); } });

  // Bank selection popup
  const BANKS = [
    { code:'MB2U', name:'Maybank' }, { code:'CIMB', name:'CIMB' }, { code:'PBB',  name:'Public Bank' },
    { code:'HLB',  name:'Hong Leong Bank' }, { code:'RHB',  name:'RHB' }, { code:'AMB',  name:'AmBank' },
    { code:'BSN',  name:'BSN' }, { code:'UOB',  name:'UOB' }, { code:'HSBC', name:'HSBC' }, { code:'SCB',  name:'Standard Chartered' },
    { code:'OCBC', name:'OCBC' }, { code:'BIMB', name:'Bank Islam' }, { code:'BRB',  name:'Bank Rakyat' }, { code:'AFF',  name:'Affin Bank' }
  ];
  els.btnChooseBank?.addEventListener('click', async ()=>{
    if(!window.openPopup){ return alert('Popup module missing'); }
    const result = await window.openPopup('bank-select', { banks: BANKS });
    if(result){ localStorage.setItem(LS_BANK, JSON.stringify(result)); els.bankChosen.textContent = result.name; announce(`Bank ${result.name} selected`); }
  });

  function buildOrder(){
    const totals = computeTotals();
    const bank = JSON.parse(localStorage.getItem(LS_BANK) || 'null');
    const fd = new FormData(els.form);
    const customer = { name: fd.get('name')||'', email: fd.get('email')||'', phone: fd.get('phone')||'', notes: fd.get('notes')||'' };
    let outletId = null;
  try { const sel = JSON.parse(localStorage.getItem('gf_pickup_outlet')||'null'); if(sel && sel.id) outletId = sel.id; } catch (e) { void e; }
    return {
      id: 'ORD-' + Date.now().toString(36),
      created: Date.now(),
      status: 'pending',
      items: totals.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      loyalty: totals.loyalty,
      tax: totals.tax,
      delivery: totals.delivery,
      total: totals.total,
      payment: { method:'fpx', bank: bank? bank.code: null },
      fulfilment,
      customer,
      promo: totals.promo? totals.promo.code : null,
      outletId
    };
  }

  async function submitOrder(){
    if(!validate()){ announce('Please fix validation errors'); return; }
    if(window.CartState.get().length===0){ return alert('Your cart is empty.'); }
    const bank = JSON.parse(localStorage.getItem(LS_BANK) || 'null');
    if(!bank){ return alert('Please choose a bank.'); }
    els.pay.disabled = true; els.pay.textContent = 'Processing…';
    const order = buildOrder();
    try {
      // Try to POST to backend
      const resp = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      if (!resp.ok) {
        const err = await resp.json().catch(()=>({error:'Unknown error'}));
        throw new Error(err.error || 'Order submission failed');
      }
      const data = await resp.json();
      announce('Order submitted');
      afterSuccess({ ...order, orderId: data.orderId }, false);
    } catch(e){
      console.error(e);
      alert('Failed submitting order: ' + (e.message || e));
      els.pay.disabled=false; els.pay.textContent='Pay Now';
    }
  }

  function afterSuccess(order, queued){
    // Persist order history (simple local storage list separate from earlier analytics if needed)
    const key='checkout:orders';
    const list = JSON.parse(localStorage.getItem(key)||'[]');
    list.push(order); localStorage.setItem(key, JSON.stringify(list));
    // Notify missions engine
    try { if(window.Missions) window.Missions.recordOrder(order); } catch(e) { console.warn('Mission record failed', e); }
    // Loyalty bookkeeping: spend applied, then earn on subtotal (pre-promo, pre-loyalty) * EARN_RATE
    try {
      if(window.Loyalty){
        // Remove applied points from balance
        window.Loyalty.spendApplied();
        // Earn new points: based on order.subtotal before discounts? requirement states earn on subtotal (pre-discount)
        const earnRate = 5; // keep in sync with LOYALTY_EARN_RATE
        const earn = Math.floor(order.subtotal * earnRate);
        if(earn>0) window.Loyalty.addEarned(earn);
      }
    } catch(e) { console.warn('Loyalty update failed', e); }
    // Also push into existing global orderHistory structure if present
    try {
      const history = JSON.parse(localStorage.getItem('orderHistory')||'[]');
      // Map to legacy shape fields if needed
      const legacy = {
        id: order.id,
        created: order.created,
        readyAt: order.created + 5*60*1000,
        completedAt: order.created + 10*60*1000,
        status: 'preparing',
        items: order.items.map(i=>({ id:i.id, name:i.name||i.id, price:i.price, qty:i.qty })),
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total
      };
      history.push(legacy);
      localStorage.setItem('orderHistory', JSON.stringify(history));
    } catch(e){ /* ignore */ }
    window.CartState.clear();
    localStorage.removeItem(LS_PROMO); saveDraft();
    els.pay.textContent = queued? 'Queued' : 'Paid';
    setTimeout(()=>{ location.href='./index.html'; }, 900);
  }

  els.pay?.addEventListener('click', submitOrder);

  // Malaysian address validation helpers
  function validateMYName(name) {
    return !!name && name.trim().length > 0;
  }
  function validateMYPhone(phone) {
    return /^01\d{8,9}$/.test(phone.trim());
  }
  function extractPostcode(addr) {
    const m = addr.match(/\b(\d{5})\b/);
    return m ? m[1] : null;
  }
  function validateMYPostcode(addr) {
    const pc = extractPostcode(addr);
    return !!pc && /^\d{5}$/.test(pc);
  }
  function validateMYAddress(addr) {
    return !!addr && addr.trim().length > 0 && validateMYPostcode(addr);
  }

  function validateCheckoutFields(address) {
    return {
      name: validateMYName(address.name),
      phone: validateMYPhone(address.phone),
      addr: validateMYAddress(address.addr),
      postcode: validateMYPostcode(address.addr)
    };
  }

  // In your checkout logic, call validateCheckoutFields(state.address) and show errors as needed.
})();
