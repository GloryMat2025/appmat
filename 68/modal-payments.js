// modal-payments.js
// Lightweight controller for shipping and payment modals.
// - wires up open/close buttons
// - validates shipping fields (dName, dPhone, dAddr)
// - integrates with window.apiReservations for create/release and countdown

(function(){
  /* eslint-disable-next-line no-unused-vars */
  const _qs = (s) => document.querySelector(s);
  const id = (s) => document.getElementById(s);

  // Elements (as in your HTML snippets)
  const shipModal = id('shipModal');
  const closeShip = id('closeShip');
  const dName = id('dName');
  const dPhone = id('dPhone');
  const dAddr = id('dAddr');
  const errName = id('errName');
  const errPhone = id('errPhone');
  const errAddr = id('errAddr');

  const payModal = id('payModal');
  const closePay = id('closePay');
  const payNow = id('payNow');
  const payStatus = id('payStatus');
  /* eslint-disable-next-line no-unused-vars */
  const _payLive = id('payLive');
  const reserveTimer = id('reserveTimer');

  // small helpers
  function showError(el, msg){ if(!el) return; el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
  function clearErrors(){ showError(errName,''); showError(errPhone,''); showError(errAddr,''); }

  // unify pay status updates: visible + ARIA live region
  function announcePayStatus(msg){
    try { if (payStatus) payStatus.textContent = msg; } catch(e){ void e; }
    try { const live = document.getElementById('payLive'); if (live) live.textContent = msg; } catch(e){ void e; }
  }

  function validateShipping(){
    clearErrors();
    const errors = { name: '', phone: '', addr: '' };
    if (!dName || !dName.value.trim()){ errors.name = 'Sila masukkan nama'; }
    if (!dPhone || !/^[0-9+ \-()]{6,20}$/.test(dPhone.value.trim())){ errors.phone = 'Nombor telefon tidak sah'; }
    if (!dAddr || !dAddr.value.trim()){ errors.addr = 'Sila masukkan alamat'; }

    const setErr = (id, msg) => {
      const elx = document.getElementById(id);
      if(!elx) return;
      elx.textContent = msg || '';
      elx.style.display = msg ? 'block' : 'none';
    };
    setErr('errName', errors.name);
    setErr('errPhone', errors.phone);
    setErr('errAddr', errors.addr);

    // reflect validity for screen readers
    if (dName) dName.setAttribute('aria-invalid', errors.name ? 'true' : 'false');
    if (dPhone) dPhone.setAttribute('aria-invalid', errors.phone ? 'true' : 'false');
    if (dAddr) dAddr.setAttribute('aria-invalid', errors.addr ? 'true' : 'false');

    // autofocus first invalid input to help keyboard/screen-reader users
    if (errors.name || errors.phone || errors.addr) {
      const firstInvalid = errors.name ? dName : (errors.phone ? dPhone : dAddr);
      try { firstInvalid && firstInvalid.focus && firstInvalid.focus(); } catch (e) { /* ignore */ }
    }

    return !errors.name && !errors.phone && !errors.addr;
  }

  // Modal open/close with focus handling
  function openModal(modal){ if(!modal) return; modal.style.display = 'block'; const first = modal.querySelector('input,button,textarea,select'); if(first) first.focus(); }
  function closeModal(modal){ if(!modal) return; modal.style.display = 'none'; }

  // Expose closePayModal/openPayModal if not present (other code may call them)
  async function openPayModal(){
  // reset status
  announcePayStatus('');

    // build a minimal sample items list from a global `state.cart` if available
    const state = window.state || {};
    const need = (state.cart || []).reduce((acc,l)=>{ acc[l.productId]=(acc[l.productId]||0)+l.qty; return acc; },{});
    const items = Object.entries(need).map(([productId, qty]) => ({ productId, qty }));

    try {
      const svr = await window.apiReservations.apiCreateReservation({ items, ttlMs: window.apiReservations.RESERVE_MS });
      window.apiReservations.setActiveReservationId(svr.reservationId);
      window.apiReservations.setReservations([ { id: svr.reservationId, expiresAt: svr.expiresAt } ]);
  window.apiReservations.startReserveCountdown(svr.expiresAt, { el: { reserveTimer, payStatus }, onExpire: (_id)=>{ /* noop */ } });
    } catch (e){
      void e;
      // fallback local
      const res = await window.apiReservations.tryReserveCart();
      if (!res.ok){ announcePayStatus(`Maaf, stok tidak mencukupi.`); return; }
      const id_ = res.reservationId || ('local-'+Date.now());
      window.apiReservations.setActiveReservationId(id_);
      const arr = window.apiReservations.getReservations(); arr.push({ id: id_, expiresAt: res.expiresAt }); window.apiReservations.setReservations(arr);
      window.apiReservations.startReserveCountdown(res.expiresAt, { el: { reserveTimer, payStatus } });
    }

    openModal(payModal);

    // Attach Enter key handler inside pay modal to trigger payNow unless in a textarea
    try {
        if (payModal && payNow && !payModal.__enterHandlerAttached) {
        const payHandler = (e) => {
          if (e.key === 'Enter' && document.activeElement && document.activeElement.tagName !== 'TEXTAREA'){
            e.preventDefault();
            try { payNow.click(); } catch(err){ void err; }
          }
        };
        payModal.addEventListener('keydown', payHandler);
        payModal.__enterHandlerAttached = true;
      }
    } catch(e) { /* ignore */ }
  }

  async function closePayModal(){
    // clear countdown
    window.apiReservations.clearReserveCountdown();
    const id_ = window.apiReservations.getActiveReservationId();
    if (id_) {
      try { 
        if (typeof window.apiReservations.apiReleaseReservationReliable === 'function') {
          await window.apiReservations.apiReleaseReservationReliable(id_);
        } else {
          await window.apiReservations.apiReleaseReservation(id_);
        }
      } catch(e){ void e; }
      window.apiReservations.releaseReservation(id_);
    }
    closeModal(payModal);
  }

  // expose for other scripts
  window.openPayModal = window.openPayModal || openPayModal;
  window.closePayModal = window.closePayModal || closePayModal;

  // Ship modal actions
  function openShipModal(){
    openModal(shipModal);

    // Attach Enter key handler to delivery inputs so Enter triggers saveDelivery
    try {
      const saveBtn = document.getElementById('saveDelivery');
      const inputs = [document.getElementById('dName'), document.getElementById('dPhone'), document.getElementById('dAddr')];
        if (saveBtn && inputs && !shipModal.__enterHandlerAttached) {
        const handler = (e) => {
          const state = window.state || {};
          if (e.key === 'Enter' && state.ship === 'delivery'){
            e.preventDefault();
            try { saveBtn.click(); } catch(err){ void err; }
          }
        };
        inputs.forEach(inp=>{ if (inp) inp.addEventListener('keydown', handler); });
        shipModal.__enterHandlerAttached = true; // guard to avoid duplicates
      }
    } catch (e) { /* ignore */ }
  }
  function closeShipModal(){ closeModal(shipModal); }
  window.openShipModal = window.openShipModal || openShipModal;
  window.closeShipModal = window.closeShipModal || closeShipModal;

  // Wire close buttons
  if (closeShip) closeShip.addEventListener('click', ()=>{ closeShipModal(); });
  if (closePay) closePay.addEventListener('click', ()=>{ closePayModal(); });

  // Pay now handler (basic demo of payment flow - replace with real payment integration)
  if (payNow) payNow.addEventListener('click', async ()=>{
    // require active reservation
    const activeId = window.apiReservations.getActiveReservationId();
  if (!activeId){ announcePayStatus("Tempahan stok tiada/luput. Sila buka semula pembayaran."); return; }

    // basic shipping validation before payment
  if (!validateShipping()){ announcePayStatus('Sila betulkan maklumat penghantaran.'); return; }

  /* eslint-disable-next-line no-unused-vars */
  const _method = (window.state && window.state.payment && window.state.payment.method) || 'fpx';
  announcePayStatus('Memproses pembayaran...');
    payNow.disabled = true;

    // simulate async payment (replace with real)
    await new Promise(r => setTimeout(r, 900));
    const fail = Math.random() < 0.08;
    if (fail){
      announcePayStatus('Pembayaran gagal. Cuba lagi.');
      payNow.disabled = false;
      // release reservation
      window.apiReservations.clearReserveCountdown();
      const id_ = window.apiReservations.getActiveReservationId();
      if (id_) {
        if (typeof window.apiReservations.apiReleaseReservationReliable === 'function') {
          window.apiReservations.apiReleaseReservationReliable(id_).catch(()=>{});
        } else {
          window.apiReservations.apiReleaseReservation(id_).catch(()=>{});
        }
        window.apiReservations.releaseReservation(id_);
      }
      return;
    }

    // success: commit local reservation
    const id_ = window.apiReservations.getActiveReservationId();
    window.apiReservations.clearReserveCountdown();
    // (commitReservation and create order are application-specific; trigger events instead)
    if (typeof window.onPaymentSuccess === 'function') {
      try { window.onPaymentSuccess({ reservationId: id_ }); } catch(e){ void e; }
    }

    // release server reservation best-effort
  if (id_) { try { if (typeof window.apiReservations.apiReleaseReservationReliable === 'function') { await window.apiReservations.apiReleaseReservationReliable(id_); } else { await window.apiReservations.apiReleaseReservation(id_); } } catch(e){ void e; } window.apiReservations.releaseReservation(id_); }

  announcePayStatus('Berjaya');
    setTimeout(()=> closePayModal(), 500);
  });

  // expose validation util
  window.validateShipping = validateShipping;

})();
