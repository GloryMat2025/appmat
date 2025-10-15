// /js/main.js
(function(){
  const dBtn = document.getElementById('btnDelivery');
  const pBtn = document.getElementById('btnPickup');
  const regionRow = document.getElementById('regionRow');
  const regionChipsInline = document.getElementById('regionChipsInline');
  const summary = document.getElementById('selectionSummary');

  const LS_ADDR = 'gf_delivery_address';
  const LS_OUTL = 'gf_pickup_outlet';
  let mode = 'delivery';

  function setMode(m){
    mode = m;
    if(m==='delivery'){
      dBtn.classList.add('toggle-active'); dBtn.classList.remove('toggle-idle');
      pBtn.classList.add('toggle-idle');   pBtn.classList.remove('toggle-active');
      regionRow.classList.add('hidden');
    }else{
      pBtn.classList.add('toggle-active'); pBtn.classList.remove('toggle-idle');
      dBtn.classList.add('toggle-idle');   dBtn.classList.remove('toggle-active');
      regionRow.classList.remove('hidden');
    }
    updateSummary();
  }

  function updateSummary(){
    const addr = JSON.parse(localStorage.getItem(LS_ADDR) || 'null');
    const outl = JSON.parse(localStorage.getItem(LS_OUTL) || 'null');
    summary.textContent =
      mode === 'delivery'
        ? (addr ? `Deliver to: ${addr.line1 || addr.city || 'Saved address'}` : 'No address set yet.')
        : (outl ? `Pickup: ${outl.name} · ${outl.region}` : 'No outlet selected yet.');
  }

  function buildInlineRegionChips(){
    regionChipsInline.innerHTML = '';
    window.REGIONS.forEach(r=>{
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'px-3 py-1.5 rounded-full border text-sm bg-white hover:bg-gray-50';
      b.textContent = r;
      b.addEventListener('click', async ()=>{
        const chosen = await window.openPopup('select-your-outlet', { regions: window.REGIONS, outlets: window.OUTLETS, region: r });
        if(chosen){
          localStorage.setItem(LS_OUTL, JSON.stringify(chosen));
          setMode('pickup');
        }
      });
      regionChipsInline.appendChild(b);
    });
  }

  // Events
  dBtn.addEventListener('click', async ()=>{
    const prefill = JSON.parse(localStorage.getItem(LS_ADDR) || 'null') || undefined;
    const data = await window.openPopup('set-your-address', { prefill });
    if(data){ localStorage.setItem(LS_ADDR, JSON.stringify(data)); setMode('delivery'); }
  });

  pBtn.addEventListener('click', async ()=>{
    const chosen = await window.openPopup('select-your-outlet', { regions: window.REGIONS, outlets: window.OUTLETS });
    if(chosen){ localStorage.setItem(LS_OUTL, JSON.stringify(chosen)); setMode('pickup'); }
  });

  // init
  setMode('delivery');
  buildInlineRegionChips();
  updateSummary();
})();
