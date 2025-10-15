// Persistent Theme Toggle
const THEME_KEY = 'theme';
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    localStorage.setItem(THEME_KEY, 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem(THEME_KEY, 'light');
  }
}
function getSavedTheme() {
  return localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
function setupThemeToggle() {
  const themeBtn = document.querySelector('[data-theme-toggle]');
  if (!themeBtn) return;
  themeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
    // Optionally update button icon/text
    themeBtn.textContent = isDark ? '🌙' : '☀️';
  });
  // Set initial icon/text
  themeBtn.textContent = getSavedTheme() === 'dark' ? '☀️' : '🌙';
}
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getSavedTheme());
  setupThemeToggle();
});
// Connectivity banner logic
function updateConnectivityBanner() {
  const banner = document.getElementById('connectivityBanner');
  if (!banner) return;
  if (navigator.onLine) {
    banner.classList.add('hidden');
  } else {
    banner.classList.remove('hidden');
  }
}
window.addEventListener('online', updateConnectivityBanner);
window.addEventListener('offline', updateConnectivityBanner);
window.addEventListener('DOMContentLoaded', updateConnectivityBanner);
// Util
const $  = (s, el=document) => el.querySelector(s);
// Push Notification Registration & Test
function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      showTestNotification();
    }
  });
}

function showTestNotification() {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.showNotification('AppMat Demo', {
          body: 'This is a test notification!',
          icon: '/asserts/icon-192.png',
        });
      }
    });
  }
}

// Expose for demo button
window.requestNotificationPermission = requestNotificationPermission;
window.showTestNotification = showTestNotification;
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const fmtRM = (n) => `RM${n.toFixed(2)}`;
// Performance baseline timestamp
const __appStart = performance.now();
// Loyalty constants
const LOYALTY_EARN_RATE = 5; // points per RM1 subtotal (pre-discount)
const LOYALTY_REDEEM_RATE = 100; // 100 pts = RM1 discount
const LS_POINTS_KEY = 'loyaltyPoints';
const LS_REDEEM_KEY = 'loyaltyRedeem'; // number of points currently applied for discount

function loadLoyaltyPoints(){
  const v = Number(localStorage.getItem(LS_POINTS_KEY)||'0');
  return Number.isFinite(v) && v>=0 ? Math.floor(v) : 0;
}
function saveLoyaltyPoints(p){ localStorage.setItem(LS_POINTS_KEY, String(Math.max(0, Math.floor(p||0)))); }
function addLoyaltyPoints(delta){ const cur = loadLoyaltyPoints(); saveLoyaltyPoints(cur + Math.max(0, Math.floor(delta||0))); }
function loadRedeemedPoints(){ const v = Number(localStorage.getItem(LS_REDEEM_KEY)||'0'); return Number.isFinite(v)&&v>0?Math.floor(v):0; }
function saveRedeemedPoints(p){ if(p>0) localStorage.setItem(LS_REDEEM_KEY, String(Math.floor(p))); else localStorage.removeItem(LS_REDEEM_KEY); }
function clearRedeemedPoints(){ saveRedeemedPoints(0); }
function computeMaxRedeemablePoints(subtotalAfterPromo){
  const available = loadLoyaltyPoints();
  if(subtotalAfterPromo <= 0) return 0;
  // Max RM discount limited by subtotalAfterPromo (cannot reduce below 0) then convert to points
  const maxCurrency = subtotalAfterPromo; // RM
  const maxPointsBySubtotal = Math.floor(maxCurrency * LOYALTY_REDEEM_RATE);
  return Math.min(available, maxPointsBySubtotal);
}
function loyaltyDiscountFromPoints(points){ return (points / LOYALTY_REDEEM_RATE); }

// Loyalty module (lightweight – can be reused across pages)
window.Loyalty = (function(){
  function balance(){ return loadLoyaltyPoints(); }
  function applied(){ return loadRedeemedPoints(); }
  function applyMax(subtotalAfterPromo){
    // If subtotalAfterPromo not provided, attempt to derive from cart items on menu/cart pages
    let sub = subtotalAfterPromo;
    if(typeof sub !== 'number'){
      try{ if(typeof currentCartSubtotal === 'function') sub = currentCartSubtotal(); }catch{ sub = 0; }
    }
    const maxPts = computeMaxRedeemablePoints(sub||0);
    saveRedeemedPoints(maxPts);
    dispatchChange();
    return maxPts;
  }
  function clear(){ clearRedeemedPoints(); dispatchChange(); }
  function addEarned(points){ addLoyaltyPoints(points); dispatchChange(); }
  function spendApplied(){
    const pts = applied();
    if(pts>0){
      const cur = balance();
      saveLoyaltyPoints(Math.max(0, cur - pts));
      clearRedeemedPoints();
      dispatchChange();
    }
  }
  function discountRM(){ return loyaltyDiscountFromPoints(applied()); }
  function dispatchChange(){ window.dispatchEvent(new CustomEvent('loyaltychange', { detail:{ balance: balance(), applied: applied() } })); }
  // Debug helpers (non-production) - allow seeding via console: Loyalty._debugSeed(500)
  function _debugSeed(pts){ addLoyaltyPoints(pts); dispatchChange(); }
  function _debugClear(){ saveLoyaltyPoints(0); clearRedeemedPoints(); dispatchChange(); }
  return { balance, applied, applyMax, clear, addEarned, spendApplied, discountRM, dispatchChange, _debugSeed, _debugClear };
})();

// Bind loyalty summary widgets (if present on current page)
document.addEventListener('DOMContentLoaded', () => {
  const summary = document.querySelector('[data-loyalty-summary]');
  if(!summary) return;
  function render(){
    const balEl = summary.querySelector('[data-loyalty-balance]');
    const appliedEl = summary.querySelector('[data-loyalty-applied]');
    const appliedRMEl = summary.querySelector('[data-loyalty-applied-rm]');
    if(balEl) balEl.textContent = window.Loyalty.balance();
    if(appliedEl) appliedEl.textContent = window.Loyalty.applied();
    if(appliedRMEl) appliedRMEl.textContent = window.Loyalty.discountRM().toFixed(2);
  }
  window.addEventListener('loyaltychange', render);
  render();
  // Buttons
  const btnApply = summary.querySelector('[data-loyalty-apply-max]');
  const btnClear = summary.querySelector('[data-loyalty-clear]');
  if(btnApply){
    btnApply.addEventListener('click', () => {
      // Attempt derive subtotal from cart if available; fallback to explicit input field maybe later
      let sub = 0;
      try{ if(typeof currentCartSubtotal === 'function') sub = currentCartSubtotal(); }catch{}
      const pts = window.Loyalty.applyMax(sub);
      showToast(t('loyalty.msg.applied').replace('{{amount}}', fmtRM(window.Loyalty.discountRM())));
    });
  }
  if(btnClear){
    btnClear.addEventListener('click', () => {
      window.Loyalty.clear();
      showToast(t('toast.loyaltyCleared'), { type:'info' });
    });
  }
  const btnRefresh = summary.querySelector('[data-loyalty-refresh]');
  if(btnRefresh){ btnRefresh.addEventListener('click', () => window.Loyalty.dispatchChange()); }
});

// ---------------- Missions Engine ----------------
// Simple mission types supported: order_count (number of orders), spend_amount (cumulative RM spend), distinct_outlets (unique outlet ids in orders)
// Persistence:
//  - missions stored in localStorage key 'missions:v1'
//  - progress events (orders) reused from existing orderHistory + new orders
const LS_MISSIONS = 'missions:v1';
function defaultMissions(){
  return [
    { id:'m_orders_3',   type:'order_count',    target:3,   reward:150, title:'Place 3 Orders',         desc:'Complete 3 orders of any value.' },
    { id:'m_spend_50',   type:'spend_amount',   target:50,  reward:200, title:'Spend RM50 Total',        desc:'Accumulate RM50 in subtotal (before tax).' },
    { id:'m_outlets_2',  type:'distinct_outlets', target:2, reward:120, title:'Order From 2 Outlets',    desc:'Place orders from 2 different outlets.' }
  ];
}
function loadMissions(){
  try { const raw = JSON.parse(localStorage.getItem(LS_MISSIONS)||'[]'); if(Array.isArray(raw)&&raw.every(m=>m&&m.id)) return raw; } catch{}
  const seeds = defaultMissions(); saveMissions(seeds); return seeds;
}
function saveMissions(list){ localStorage.setItem(LS_MISSIONS, JSON.stringify(list)); }
window.Missions = (function(){
  let missions = loadMissions();
  function all(){ return missions.slice(); }
  function computeProgress(m){
    // Derive from stored lightweight order ledger (checkout:orders)
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('checkout:orders')||'[]'); } catch{}
    if(!Array.isArray(orders)) orders=[];
    switch(m.type){
      case 'order_count': return orders.length;
      case 'spend_amount': return orders.reduce((s,o)=> s + (o.subtotal||0), 0);
      case 'distinct_outlets': {
        const set = new Set(); orders.forEach(o=>{ if(o.outletId) set.add(o.outletId); });
        return set.size;
      }
      default: return 0;
    }
  }
  function status(m){
    const prog = computeProgress(m);
    const done = prog >= m.target;
    return { progress: prog, complete: done, claimed: !!m.claimed };
  }
  function claim(id){
    const idx = missions.findIndex(m=>m.id===id);
    if(idx===-1) return { ok:false, reason:'not_found' };
    const m = missions[idx];
    const st = status(m);
    if(!st.complete) return { ok:false, reason:'incomplete' };
    if(st.claimed) return { ok:false, reason:'claimed' };
    missions[idx] = { ...m, claimed:true, claimedAt: Date.now() };
    saveMissions(missions);
    if(window.Loyalty){ window.Loyalty.addEarned(m.reward); }
    window.dispatchEvent(new CustomEvent('missionclaim', { detail:{ mission: missions[idx] } }));
    return { ok:true, reward:m.reward };
  }
  function recordOrder(order){
    // Right now progress is computed on-demand from orders list, so nothing to do besides maybe dispatch update
    window.dispatchEvent(new Event('missionschange'));
  }
  function resetAll(){ missions = defaultMissions(); saveMissions(missions); window.dispatchEvent(new Event('missionschange')); }
  return { all, status, claim, recordOrder, resetAll };
})();

// Render missions on rewards page
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('missionsGrid');
  if(!grid) return;
  function render(){
    const list = window.Missions.all();
    grid.innerHTML = '';
    list.forEach(m => {
      const st = window.Missions.status(m);
      const pct = Math.min(100, Math.round((st.progress / m.target)*100));
      const card = document.createElement('article');
      card.className = 'rounded-xl ring-1 ring-gray-200 overflow-hidden bg-white flex flex-col';
      card.innerHTML = `
        <div class="p-4 flex-1 flex flex-col">
          <h3 class="font-medium">${m.title}</h3>
          <p class="text-xs text-gray-500 mt-1">${m.desc}</p>
          <div class="mt-3 h-2 rounded bg-gray-100 overflow-hidden"><div style="width:${pct}%" class="h-full bg-blue-600 transition-all"></div></div>
          <div class="mt-2 text-[11px] text-gray-600 flex justify-between"><span>${st.progress} / ${m.target}</span><span>+${m.reward} pts</span></div>
        </div>
        <div class="p-3 border-t flex items-center justify-end">
          ${st.claimed ? `<span class='text-xs font-semibold text-green-600' data-i18n="missions.claimed">${t('missions.claimed')}</span>` : st.complete ? `<button data-claim='${m.id}' class='px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold' data-i18n="missions.claim">${t('missions.claim')}</button>` : `<button disabled class='px-3 py-1.5 rounded-lg bg-gray-200 text-gray-500 text-sm font-semibold' data-i18n="missions.inProgress">${t('missions.inProgress')}</button>`}
        </div>`;
      grid.appendChild(card);
    });
  }
  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-claim]');
    if(!btn) return;
    const id = btn.getAttribute('data-claim');
    const res = window.Missions.claim(id);
    if(res.ok){ showToast(`Claimed +${res.reward} pts`); if(window.Loyalty) window.Loyalty.dispatchChange(); }
    else { showToast(res.reason==='claimed' ? 'Already claimed' : 'Not complete'); }
    render();
  });
  window.addEventListener('missionschange', render);
  window.addEventListener('missionclaim', render);
  render();
});

// ---------------- Internationalization (i18n) ----------------
// Language codes supported
let currentLang = localStorage.getItem('lang') || 'en';
const TRANSLATIONS = {
  en: {
    mode: { delivery: 'Delivery', pickup: 'Pickup' },
    lang: { toggle: 'MS' }, // shows target language code
    theme: { light: 'Light', dark: 'Dark' },
    card: { wallet: 'Wallet Balance', vouchers: 'eVouchers', points: 'Points' },
    last: {
      title: 'Your Last Order',
      viewAll: 'View All',
      empty: 'No last order yet.<br/>Start ordering now.',
      reorder: 'Re-order',
      placed: 'Placed'
    },
    referral: { msg: 'Refer your friends and<br><span class="font-semibold">get up to 80% Off</span>' },
    status: { preparing: 'Preparing', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' },
  eta: { prefix: 'ETA' },
  time: { lt1m: '<1m', about1m: '~1m', minutes: '~{{m}}m', hourRem: '~1h{{m}}', hoursRem: '~{{h}}h{{m}}', zero: '0m' },
  settings: { demo: 'Fast Demo Mode', export: 'Export Settings', import: 'Import Settings', reset: 'Reset Settings', exported: 'Settings exported', imported: 'Settings imported', importFailed: 'Import failed', demoOn: 'Demo mode on (10s/20s)', demoOff: 'Demo mode off' },
  analytics: { totalOrders:'Total Orders', active:'Active (Preparing/Ready)', completed:'Completed', cancelled:'Cancelled', totalSpend:'Total Spend', aov:'Avg Order Value', topItem:'Top Item', topQty:'Top Item Qty', avgPrep:'Avg Prep Time', avgReady:'Avg Ready Phase', cancelRate:'Cancel Rate' },
    trends: { title:'Trends', detail:'Detail', hide:'Hide', cache:'Cache Info', purgeConfirm:'Purge runtime caches (keep precache)?', export:'Export CSV' },
  perf: { title:'Performance', appReady:'App Ready (ms)', avgGrid:'Avg Product Grid Render (ms)', renders:'Grid Renders', reset:'Reset Perf' },
  'perf.syncLatency': 'Last Queue Sync (ms)',
  'perf.syncAvg': 'Avg Sync (ms)',
  'perf.syncP95': 'P95 Sync (ms)',
  'perf.syncMedian': 'Median Sync (ms)',
  'perf.syncP90': 'P90 Sync (ms)',
  'perf.syncMax': 'Max Sync (ms)',
  'perf.failures': 'Failed Actions',
  'perf.exportAll': 'Export All Analytics',
  'perf.latencyAlert': 'High sync latency (p95)',
  'settings.title': 'Settings',
  'settings.save': 'Save',
  'settings.latencyThreshold': 'Latency Alert Threshold (p95 ms)',
  'settings.latencyCooldown': 'Latency Alert Cooldown (ms)',
  'settings.latencyCap': 'Latency History Cap',
  'failed.title': 'Failed Actions',
  'failed.requeueAll': 'Requeue All',
  'failed.clearAll': 'Clear All',
  'settings.reset': 'Reset Defaults',
  'theme.dark': 'Dark Mode',
  'theme.light': 'Light Mode',
  'outlet.title': 'Select Your Outlet',
  'outlet.select': 'Select Outlet',
  'outlet.change': 'Change Outlet',
  'outlet.search': 'Search outlets',
  'outlet.save': 'Save Outlet',
  'outlet.all': 'All Outlets',
  'outlet.clear': 'Clear',
  'outlet.filteredNotice': 'Showing {shown} of {total} products for {name}',
  'perf.syncCount': 'Sync Samples',
  'perf.syncTrend': 'Sync Trend',
  'perf.syncExport': 'Export Syncs',
  'perf.syncClear': 'Clear Syncs',
  accessibility: { contrast:'High Contrast Mode', network: { online:'Online', offline:'Offline (cached)', syncNow:'Sync Now', lastSync:'Last Sync', syncing:'Syncing...', queued:'Queued', queue:'Queue', queueDebug:'Queue Debug', history:'History', empty:'Empty', flush:'Flush Now', export:'Export JSON', close:'Close', items:'items' } },
  pwa: { install:'Install App', installed:'App Installed', dismiss:'Not Now' },
  'pwa.funnel': { title:'PWA Install Funnel', ctaShown:'CTA Shown', ctaClicked:'CTA Clicked', promptAccepted:'Prompt Accepted', promptDismissed:'Prompt Dismissed', installed:'Installed', rates:'Rates (CTR / Accept / Install)', refresh:'Refresh', export:'Export', reset:'Reset', resetConfirm:'Reset all install analytics?' },
    orders: { toggle: { show: 'Show Details', hide: 'Hide' }, cancel: 'Cancel' },
    menu: { title: 'Menu' },
    nav: { home: 'Home', menu: 'Menu', gift: 'Gift', rewards: 'Rewards', account: 'Account', cart: 'Cart' },
  gift: {
    placeholder: 'Gift features coming soon. Add vouchers or gift cards here.',
    intro: 'Add and redeem your gift vouchers below.',
    addLabel: 'Add Voucher Code',
  inputPlaceholder: 'Enter code',
    your: 'Your Vouchers',
    empty: 'No vouchers yet. Add a code above.',
    note: 'Redeeming a voucher converts its RM value into loyalty points.',
    redeem: 'Redeem',
    redeemed: 'Redeemed',
    value: 'Value',
    pointsEarned: 'Points Earned',
    invalid: 'Invalid or duplicate code',
    added: 'Voucher added',
    redeemedToast: 'Voucher redeemed for {{points}} pts',
    filter: { all:'All', active:'Active', redeemed:'Redeemed' },
    stat: { totalValue:'Total Value', redeemedValue:'Redeemed', points:'Points Earned' }
  },
    search: { placeholder: 'Search' },
  // Search extended
  searchExtra: { empty: 'No matches for your search', clear: 'Clear' },
    a11y: {
      skip: 'Skip to main content',
      carousel: { region: 'Promotions Carousel', previous: 'Previous slide', next: 'Next slide', dot: 'Go to slide {{n}}' },
      themeToggle: { label: 'Toggle color theme' },
      langToggle: { label: 'Toggle language' },
      toastRegion: 'Notifications'
    },
    cache: { purged:'Runtime caches purged', requesting:'Requesting cache info...', none:'No SW controller' },
    favorites: {
      filterOnly: 'Only Favorites',
      empty: 'No favorites yet.',
      add: 'Add to favorites',
      remove: 'Remove from favorites'
    },
    promo: {
      label: 'Promo Code',
      placeholder: 'Enter code',
      apply: 'Apply',
      remove: 'Remove',
      invalid: 'Invalid or not applicable',
      applied: 'Code applied',
      discount: 'Discount'
    },
    loyalty: {
      label: 'Loyalty Points',
      balance: 'Balance',
      applied: 'Applied',
      apply: 'Apply Max',
      clear: 'Clear',
      msg: { applied: 'Applied discount {{amount}}' }
    },
    missions: {
      claim: 'Claim',
      claimed: 'Claimed',
      inProgress: 'In Progress'
    },
    toast: {
      cartAdded: '{{name}} +1',
      cartQtyInc: '{{name}} +1',
      cartQtyDec: '{{name}} -1',
      cartQtyIncMany: '{{name}} +{{n}}',
      cartQtyDecMany: '{{name}} -{{n}}',
      cartAddedMulti: '{{name}} +{{n}}',
      cartRemoved: 'Removed {{name}}',
      cartCleared: 'Cart cleared',
      promoApplied: 'Code applied',
      promoInvalid: 'Invalid or not applicable',
      promoRemoved: 'Promo removed',
      loyaltyApplied: 'Applied loyalty discount',
      loyaltyCleared: 'Loyalty cleared',
      missionClaim: 'Claimed +{{points}} pts',
      darkOn: 'Dark mode on',
      lightOn: 'Light mode on',
      welcome: 'Welcome back 👋',
      analyticsOn: 'Analytics enabled',
      analyticsOff: 'Analytics disabled'
    },
    // Undo removal toasts
    'toast.undoRemove': 'Removed {{name}}. Undo?',
    'toast.undo': 'Undo',
    'toast.restored': 'Restored {{name}}',
    modal: { add: 'Add to Cart', qty: 'Quantity', close: 'Close' },
  miniCart: { title:'Cart', view:'View Cart', empty:'Your cart is empty', subtotal:'Subtotal', discounts:'Discounts', total:'Total', promo:'Promo', loyalty:'Loyalty', removeLine:'Remove', ariaRemove:'Remove {{name}}' },
    products: {
  'prod-nasilemak': { name: 'Nasi Lemak', desc: 'Fragrant coconut rice with sambal, peanuts, anchovies & egg.', alt: 'Nasi Lemak with sambal, peanuts, anchovies, and egg', opt: { std:'Standard', addchicken:'Add Chicken', extrasambal:'Extra Sambal' } },
  'prod-meebandung': { name: 'Mee Bandung', desc: 'Rich savory prawn & beef broth noodle favorite.', alt: 'Mee Bandung noodle in prawn and beef broth' },
  'prod-tehais': { name: 'Teh Ais', desc: 'Chilled pulled milk tea, lightly sweet.', alt: 'Iced milk tea in a glass', opt: { reg:'Regular', lesssugar:'Less Sugar', large:'Large Size' } },
  'prod-kopilatte': { name: 'Kopi Latte', desc: 'Smooth espresso with steamed milk local style.', alt: 'Kopi Latte with steamed milk' }
    },
    categories: { all:'All', mains:'Mains', drinks:'Drinks' }
  },
  ms: {
    mode: { delivery: 'Hantar', pickup: 'Ambil' },
    lang: { toggle: 'EN' },
    theme: { light: 'Cerah', dark: 'Gelap' },
    card: { wallet: 'Baki Dompet', vouchers: 'eBaucar', points: 'Mata' },
    last: {
      title: 'Pesanan Terakhir',
      viewAll: 'Lihat Semua',
      empty: 'Belum ada pesanan.<br/>Mula buat pesanan sekarang.',
      reorder: 'Pesan Semula',
      placed: 'Dibuat'
    },
    referral: { msg: 'Rujuk rakan anda dan<br><span class="font-semibold">dapatkan sehingga 80% Diskaun</span>' },
    status: { preparing: 'Sedang Sedia', ready: 'Sedia', completed: 'Selesai', cancelled: 'Dibatalkan' },
  eta: { prefix: 'ANGGARAN' },
  time: { lt1m: '<1m', about1m: '~1m', minutes: '~{{m}}m', hourRem: '~1j{{m}}', hoursRem: '~{{h}}j{{m}}', zero: '0m' },
  settings: { demo: 'Mod Demo Pantas', export: 'Eksport Tetapan', import: 'Import Tetapan', reset: 'Tetapan Asal', exported: 'Tetapan dieksport', imported: 'Tetapan diimport', importFailed: 'Import gagal', demoOn: 'Mod demo hidup (10s/20s)', demoOff: 'Mod demo mati' },
  analytics: { totalOrders:'Jumlah Pesanan', active:'Aktif (Sedang Sedia/Sedia)', completed:'Selesai', cancelled:'Dibatalkan', totalSpend:'Jumlah Belanja', aov:'Purata Nilai Pesanan', topItem:'Item Teratas', topQty:'Kuantiti Teratas', avgPrep:'Purata Masa Sedia', avgReady:'Purata Fasa Sedia', cancelRate:'Kadar Batal' },
    trends: { title:'Tren', detail:'Butiran', hide:'Sembunyi', cache:'Info Cache', purgeConfirm:'Kosongkan cache runtime (kekal precache)?', export:'Eksport CSV' },
  perf: { title:'Prestasi', appReady:'Apl Sedia (ms)', avgGrid:'Purata Render Grid (ms)', renders:'Bil. Render Grid', reset:'Tetap Semula Prestasi' },
  'perf.syncLatency': 'Segerak Baris Terakhir (ms)',
  'perf.syncAvg': 'Purata Segerak (ms)',
  'perf.syncP95': 'P95 Segerak (ms)',
  'perf.syncMedian': 'Median Segerak (ms)',
  'perf.syncP90': 'P90 Segerak (ms)',
  'perf.syncMax': 'Maks Segerak (ms)',
  'perf.failures': 'Tindakan Gagal',
  'perf.exportAll': 'Eksport Semua Analitik',
  'perf.latencyAlert': 'Kependaman segerak tinggi (p95)',
  'settings.title': 'Tetapan',
  'settings.save': 'Simpan',
  'settings.latencyThreshold': 'Ambang Amaran Kependaman (p95 ms)',
  'settings.latencyCooldown': 'Tempoh Sejuk Amaran Kependaman (ms)',
  'settings.latencyCap': 'Had Sejarah Kependaman',
  'failed.title': 'Tindakan Gagal',
  'failed.requeueAll': 'Masuk Semula Semua',
  'failed.clearAll': 'Kosongkan Semua',
  'settings.reset': 'Tetap Semula Asal',
  'theme.dark': 'Mod Gelap',
  'theme.light': 'Mod Cerah',
  'outlet.title': 'Pilih Cawangan Anda',
  'outlet.select': 'Pilih Cawangan',
  'outlet.change': 'Tukar Cawangan',
  'outlet.search': 'Cari cawangan',
  'outlet.save': 'Simpan Cawangan',
  'outlet.all': 'Semua Cawangan',
  'outlet.clear': 'Kosongkan',
  'outlet.filteredNotice': 'Menunjukkan {shown} daripada {total} produk untuk {name}',
  'perf.syncCount': 'Sampel Segerak',
  'perf.syncTrend': 'Tren Segerak',
  'perf.syncExport': 'Eksport Segerak',
  'perf.syncClear': 'Kosongkan Segerak',
  accessibility: { contrast:'Mod Kontras Tinggi', network: { online:'Dalam Talian', offline:'Luar Talian (cache)', syncNow:'Segerakkan', lastSync:'Segerak Terakhir', syncing:'Menyegerak...', queued:'Diberatur', queue:'Baris', queueDebug:'Debug Baris', history:'Sejarah', empty:'Kosong', flush:'Segerak Sekarang', export:'Eksport JSON', close:'Tutup', items:'item' } },
  pwa: { install:'Pasang Apl', installed:'Apl Dipasang', dismiss:'Lain Kali' },
  'pwa.funnel': { title:'Corong Pemasangan PWA', ctaShown:'CTA Dipapar', ctaClicked:'CTA Diklik', promptAccepted:'Prompt Diterima', promptDismissed:'Prompt Ditolak', installed:'Dipasang', rates:'Kadar (CTR / Terima / Pasang)', refresh:'Segar Semula', export:'Eksport', reset:'Tetap Semula', resetConfirm:'Tetap semula semua analitik pemasangan?' },
    orders: { toggle: { show: 'Tunjuk Butiran', hide: 'Sembunyi' }, cancel: 'Batal' },
    menu: { title: 'Menu' },
    nav: { home: 'Laman', menu: 'Menu', gift: 'Hadiah', rewards: 'Ganjaran', account: 'Akaun', cart: 'Troli' },
  gift: {
    placeholder: 'Ciri hadiah akan datang. Tambah baucar atau kad hadiah di sini.',
    intro: 'Tambah dan tebus baucar hadiah anda di bawah.',
    addLabel: 'Tambah Kod Baucar',
    inputPlaceholder: 'Masuk kod',
    addBtn: 'Tambah',
    your: 'Baucar Anda',
    empty: 'Belum ada baucar. Tambah kod di atas.',
    note: 'Menebus baucar menukar nilai RM kepada mata kesetiaan.',
    redeem: 'Tebus',
    redeemed: 'Ditebus',
    value: 'Nilai',
    pointsEarned: 'Mata Diperoleh',
    invalid: 'Kod tidak sah atau pendua',
    added: 'Baucar ditambah',
    redeemedToast: 'Baucar ditebus untuk {{points}} mata',
    filter: { all:'Semua', active:'Aktif', redeemed:'Ditebus' },
    stat: { totalValue:'Jumlah Nilai', redeemedValue:'Nilai Ditebus', points:'Mata Diperoleh' }
  },
    search: { placeholder: 'Cari' },
  searchExtra: { empty: 'Tiada padanan untuk carian anda', clear: 'Kosong' },
    a11y: {
      skip: 'Langkau ke kandungan utama',
      carousel: { region: 'Karusel Promosi', previous: 'Slaid sebelumnya', next: 'Slaid seterusnya', dot: 'Pergi ke slaid {{n}}' },
      themeToggle: { label: 'Tukar tema warna' },
      langToggle: { label: 'Tukar bahasa' },
      toastRegion: 'Pemberitahuan'
    },
    cache: { purged:'Cache runtime dikosongkan', requesting:'Meminta info cache...', none:'Tiada pengawal SW' },
    favorites: {
      filterOnly: 'Kegemaran Sahaja',
      empty: 'Belum ada kegemaran.',
      add: 'Tambah ke kegemaran',
      remove: 'Buang dari kegemaran'
    },
    promo: {
      label: 'Kod Promo',
      placeholder: 'Masukkan kod',
      apply: 'Guna',
      remove: 'Buang',
      invalid: 'Tidak sah atau tidak sesuai',
      applied: 'Kod digunakan',
      discount: 'Diskaun'
    },
    loyalty: {
      label: 'Mata Kesetiaan',
      balance: 'Baki',
      applied: 'Diguna',
      apply: 'Guna Maks',
      clear: 'Kosong',
      msg: { applied: 'Diskaun digunakan {{amount}}' }
    },
    missions: {
      claim: 'Tuntut',
      claimed: 'Dituntut',
      inProgress: 'Sedang Berjalan'
    },
    toast: {
      cartAdded: '{{name}} +1',
      cartQtyInc: '{{name}} +1',
      cartQtyDec: '{{name}} -1',
      cartQtyIncMany: '{{name}} +{{n}}',
      cartQtyDecMany: '{{name}} -{{n}}',
      cartAddedMulti: '{{name}} +{{n}}',
      cartRemoved: 'Dibuang {{name}}',
      cartCleared: 'Troli dikosongkan',
      promoApplied: 'Kod digunakan',
      promoInvalid: 'Tidak sah atau tidak sesuai',
      promoRemoved: 'Kod dibuang',
      loyaltyApplied: 'Diskaun kesetiaan digunakan',
      loyaltyCleared: 'Kesetiaan dikosong',
      missionClaim: 'Dituntut +{{points}} mata',
      darkOn: 'Mod gelap aktif',
      lightOn: 'Mod cerah aktif',
      welcome: 'Selamat kembali 👋',
      analyticsOn: 'Analitik diaktifkan',
      analyticsOff: 'Analitik dimatikan'
    },
    'toast.undoRemove': 'Dibuang {{name}}. Buat asal?',
    'toast.undo': 'Buat Asal',
    'toast.restored': 'Dipulihkan {{name}}',
    modal: { add: 'Masuk Troli', qty: 'Kuantiti', close: 'Tutup' },
  miniCart: { title:'Troli', view:'Lihat Troli', empty:'Troli anda kosong', subtotal:'Subjumlah', discounts:'Diskaun', total:'Jumlah', promo:'Promo', loyalty:'Kesetiaan', removeLine:'Buang', ariaRemove:'Buang {{name}}' },
    products: {
  'prod-nasilemak': { name: 'Nasi Lemak', desc: 'Nasi santan wangi dengan sambal, kacang, bilis & telur.', alt: 'Nasi Lemak dengan sambal, kacang, bilis, dan telur', opt: { std:'Biasa', addchicken:'Tambah Ayam', extrasambal:'Sambal Extra' } },
  'prod-meebandung': { name: 'Mee Bandung', desc: 'Mi kuah udang & daging yang pekat dan lazat.', alt: 'Mee Bandung mi dalam kuah udang dan daging' },
  'prod-tehais': { name: 'Teh Ais', desc: 'Teh tarik sejuk berkrim, sedikit manis.', alt: 'Teh Ais dalam gelas', opt: { reg:'Biasa', lesssugar:'Kurang Gula', large:'Besar' } },
  'prod-kopilatte': { name: 'Kopi Latte', desc: 'Espresso pekat dengan susu kukus gaya tempatan.', alt: 'Kopi Latte dengan susu kukus' }
    },
    categories: { all:'Semua', mains:'Utama', drinks:'Minuman' }
  }
};

function t(key){
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  return key.split('.').reduce((o,k)=> (o && o[k] != null) ? o[k] : undefined, dict) ?? key;
}

function applyTranslations(lang=currentLang){
  currentLang = lang;
  // Simple text content
  $$('[data-i18n]').forEach(el=>{
    const k = el.getAttribute('data-i18n');
    el.textContent = t(k);
  });
  // HTML (allows inline markup)
  $$('[data-i18n-html]').forEach(el=>{
    const k = el.getAttribute('data-i18n-html');
    el.innerHTML = t(k);
  });
  // Promo placeholders & dynamic labels handled via standard data-i18n / data-i18n-placeholder attributes.
  // Prefix (keeps existing trailing HTML/text)
  $$('[data-i18n-prefix]').forEach(el=>{
    const k = el.getAttribute('data-i18n-prefix');
    const rest = el.innerHTML.replace(/^.*?\s+/,'');
    el.innerHTML = t(k) + ' ' + rest;
  });
  // Render product grid (idempotent) after updating static labels
  renderProductGrid();
  // Placeholder attributes
  $$('[data-i18n-placeholder]').forEach(el=>{
    const k = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(k));
  });
  // Toggle language button label (shows target language code)
  const langBtn = $('[data-lang-toggle]');
  if(langBtn){
    langBtn.textContent = t('lang.toggle');
  }
  // Theme toggle label refresh
  const themeBtn = $('[data-theme-toggle]');
  if(themeBtn){
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    updateToggleLabel(themeBtn, currentTheme);
  }
  // Accessibility labels
  const skipLink = $('[data-skip-link]');
  if(skipLink) skipLink.setAttribute('aria-label', t('a11y.skip'));
  const langToggle = $('[data-lang-toggle]');
  if(langToggle) langToggle.setAttribute('aria-label', t('a11y.langToggle.label'));
  if(themeBtn) themeBtn.setAttribute('aria-label', t('a11y.themeToggle.label'));
  // Modal close button (if exists)
  document.querySelectorAll('[data-modal-close]').forEach(btn=>{
    btn.setAttribute('aria-label', t('modal.close'));
  });
  const carouselRegion = $('[data-carousel-region]');
  if(carouselRegion) carouselRegion.setAttribute('aria-label', t('a11y.carousel.region'));
  $$('[data-carousel-prev]').forEach(b=> b.setAttribute('aria-label', t('a11y.carousel.previous')));
  $$('[data-carousel-next]').forEach(b=> b.setAttribute('aria-label', t('a11y.carousel.next')));
  $$('[data-carousel-dots] [data-index]').forEach(dot=>{
    const n = Number(dot.dataset.index)+1;
    dot.setAttribute('aria-label', t('a11y.carousel.dot').replace('{{n}}', n));
  });
  if(toastContainer) toastContainer.setAttribute('aria-label', t('a11y.toastRegion'));
}

function setLanguage(lang){
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyTranslations(lang);
  // Re-render dynamic areas to ensure status labels / toggles update
  renderLastOrder();
  renderOrdersPage();
  renderOrderStats();
  renderCategoryBar();
}

document.addEventListener('click',(e)=>{
  const toggle = e.target.closest('[data-lang-toggle]');
  if(toggle){
    setLanguage(currentLang === 'en' ? 'ms' : 'en');
  }
});

document.addEventListener('DOMContentLoaded', ()=>{
  applyTranslations(currentLang);
  // Performance: log app ready (DOM + initial translations)
  if(window.__analytics){
    window.__analytics.log('perf_app_ready', { ms: Math.round(performance.now() - __appStart) });
  }
});

// ---------------- Background Sync Registration (Offline Queue) ----------------
// Attempts to register a one-off background sync so queued offline actions (addCartItem, placeOrder)
// can be flushed soon after network returns even if user doesn't focus the page immediately.
(function setupBackgroundSync(){
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then(reg => {
    if('sync' in reg){
      reg.sync.register('offline-action-sync').catch(()=>{});
    } else {
      // Fallback: listen to online event and visibility change for manual trigger
      window.addEventListener('online', ()=>{
        if(window.__offlineQueue){ window.__offlineQueue.replay(); }
      });
      document.addEventListener('visibilitychange', ()=>{
        if(document.visibilityState === 'visible' && navigator.onLine && window.__offlineQueue){
          window.__offlineQueue.replay();
        }
      });
    }
  });

  // Listen for sync message from SW
  navigator.serviceWorker.addEventListener('message', ev => {
    if(!ev.data) return;
    if(ev.data.type === 'OFFLINE_QUEUE_SYNC'){
      if(window.__offlineQueue){ window.__offlineQueue.replay(); }
    }
  });

  // If user performs actions offline, request a registration proactively (in case tag cleared)
  window.addEventListener('offlinequeuechange', () => {
    if(navigator.onLine) return;
    if(navigator.serviceWorker.controller){
      navigator.serviceWorker.controller.postMessage({ type:'REGISTER_OFFLINE_ACTION_SYNC' });
    }
  });
})();

// ---------------- Client-side Analytics Logger ----------------
// Minimal, privacy-friendly event log (local only) to inspect usage patterns.
// Schema: { ts: epoch_ms, type: string, data: object }
const ANALYTICS_LS_KEY = 'analyticsEvents';
const ANALYTICS_ENABLED_KEY = 'analyticsEnabled';
function analyticsEnabled(){ return localStorage.getItem(ANALYTICS_ENABLED_KEY) !== '0'; }
function loadAnalytics(){
  try { return JSON.parse(localStorage.getItem(ANALYTICS_LS_KEY) || '[]'); } catch { return []; }
}
function saveAnalytics(list){ localStorage.setItem(ANALYTICS_LS_KEY, JSON.stringify(list.slice(-500))); } // cap length
function logEvent(type, data={}){
  if(!analyticsEnabled()) return; // respect user preference
  const list = loadAnalytics();
  list.push({ ts: Date.now(), type, data });
  saveAnalytics(list);
  window.dispatchEvent(new CustomEvent('analyticschange', { detail:{ length: list.length } }));
}
window.__analytics = { log: logEvent, list: loadAnalytics };

// Hook into existing user flows (delegated)
document.addEventListener('click', e => {
  const btnAdd = e.target.closest('[data-product-id][data-add]');
  if(btnAdd){ logEvent('add_to_cart_click', { id: btnAdd.getAttribute('data-product-id') }); }
  const favToggle = e.target.closest('[data-fav-toggle]');
  if(favToggle){ logEvent('favorite_toggle', { id: favToggle.getAttribute('data-fav-toggle') }); }
  if(e.target.matches('[data-place-order]')){ logEvent('place_order_attempt', { subtotal: currentCartSubtotal() }); }
  if(e.target.matches('[data-promo-apply]')){ const code = $('[data-promo-input]')?.value || ''; logEvent('promo_apply', { code }); }
  if(e.target.matches('[data-promo-remove]')){ logEvent('promo_remove', {}); }
});

// When order actually created
function logOrderCreation(order){
  logEvent('order_created', { id: order.id, total: order.total, items: order.items.length });
}
// Patch createOrderSnapshot after its definition via mutation observer style.
// We'll monkey-patch only if function exists later.
document.addEventListener('DOMContentLoaded', () => {
  if(typeof createOrderSnapshot === 'function'){
    const original = createOrderSnapshot;
    window.createOrderSnapshot = function(){
      const o = original.apply(this, arguments);
      if(o) logOrderCreation(o);
      return o;
    };
  }
});

// Simple UI injection on Account page
document.addEventListener('DOMContentLoaded', ()=>{
  if(document.body.matches('[data-page-account]')){
    const container = document.querySelector('[data-analytics-panel]');
    if(container){
      renderAnalyticsPanel(container);
      window.addEventListener('analyticschange', () => renderAnalyticsPanel(container));
    } else {
      const acctMain = document.querySelector('main');
      if(acctMain){
        const panel = document.createElement('section');
        panel.className = 'mt-8 border rounded-lg p-4 bg-white dark:bg-gray-800';
        panel.setAttribute('data-analytics-panel','');
        acctMain.appendChild(panel);
        renderAnalyticsPanel(panel);
        window.addEventListener('analyticschange', () => renderAnalyticsPanel(panel));
      }
    }
  }
});

// Settings toggles (notifications & analytics) on Account page
document.addEventListener('DOMContentLoaded', ()=>{
  if(!document.body.matches('[data-page-account]')) return;
  const notifBtn = document.querySelector('[data-toggle-notifs]');
  const analyticsBtn = document.querySelector('[data-toggle-analytics]');
  if(notifBtn){
    const current = notificationsAllowed();
    notifBtn.dataset.on = current ? 'true':'false';
    notifBtn.setAttribute('aria-pressed', current ? 'true':'false');
    notifBtn.addEventListener('click', async ()=>{
      const on = notifBtn.dataset.on === 'true';
      if(on){ // turning off
        localStorage.setItem(LS_NOTIF_ENABLED, '0');
        notifBtn.dataset.on='false'; notifBtn.setAttribute('aria-pressed','false');
      } else {
        const perm = await requestNotificationPermission();
        if(perm === 'granted'){
          localStorage.setItem(LS_NOTIF_ENABLED, '1');
          notifBtn.dataset.on='true'; notifBtn.setAttribute('aria-pressed','true');
          maybeNotify('Notifications Enabled','You will receive order updates.');
        } else {
          localStorage.setItem(LS_NOTIF_ENABLED, '0');
          showToast('Permission denied');
        }
      }
    });
  }
  if(analyticsBtn){
    const cur = analyticsEnabled();
    analyticsBtn.dataset.on = cur ? 'true':'false';
    analyticsBtn.setAttribute('aria-pressed', cur ? 'true':'false');
    analyticsBtn.addEventListener('click', ()=>{
      const on = analyticsBtn.dataset.on === 'true';
      if(on){
        localStorage.setItem(ANALYTICS_ENABLED_KEY, '0');
        analyticsBtn.dataset.on='false'; analyticsBtn.setAttribute('aria-pressed','false');
        showToast('Analytics disabled');
      } else {
        localStorage.removeItem(ANALYTICS_ENABLED_KEY); // default on
        analyticsBtn.dataset.on='true'; analyticsBtn.setAttribute('aria-pressed','true');
        showToast('Analytics enabled');
      }
    });
  }
});

function renderAnalyticsPanel(root){
  const list = loadAnalytics().slice().reverse();
  const rows = list.slice(0,50).map(ev => {
    const d = new Date(ev.ts).toLocaleTimeString();
    return `<tr class="text-xs"><td class="pr-2 align-top whitespace-nowrap">${d}</td><td class="pr-2 font-medium align-top">${ev.type}</td><td class="align-top text-[10px] opacity-80">${escapeHtml(JSON.stringify(ev.data))}</td></tr>`;
  }).join('');
  root.innerHTML = `
      <button type="button" data-export-settings class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-600 text-[11px] font-semibold" data-i18n="settings.export">Export Settings</button>
      <button type="button" data-import-settings class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-600 text-[11px] font-semibold" data-i18n="settings.import">Import Settings</button>
      <button type="button" data-reset-settings class="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-600 dark:text-red-300 border border-red-300/40 text-[11px] font-semibold" data-i18n="settings.reset">Reset Settings</button>
      <button type="button" data-analytics-export class="text-xs px-2 py-1 rounded bg-primary text-white">Export JSON</button>
      <button type="button" data-analytics-clear class="text-xs px-2 py-1 rounded bg-gray-600 text-white">Clear</button>
      <span class="text-xs opacity-70 self-center">${list.length} events stored</span>
    </div>
    <div class="overflow-auto max-h-56 border rounded">
      <table class="w-full text-left border-collapse">${rows || '<tr><td class="text-xs p-2">No events yet.</td></tr>'}</table>
    </div>`;
  root.querySelector('[data-analytics-export]')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(loadAnalytics(), null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'analytics-events.json'; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
  });
  root.querySelector('[data-analytics-clear]')?.addEventListener('click', () => {
    saveAnalytics([]); logEvent('analytics_cleared', {}); // will re-render via event
  });
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c] || c));
}

// Accessibility enhancements after DOM ready
document.addEventListener('DOMContentLoaded', ()=>{
  if(!$('[data-skip-link]')){
    const a = document.createElement('a');
    a.href = '#main-content';
    a.textContent = t('a11y.skip');
    a.dataset.skipLink='';
    a.className='sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg';
    document.body.prepend(a);
  }
  const main = document.querySelector('main');
  if(main && !main.id) main.id = 'main-content';
  const track = document.querySelector('[data-carousel-track]');
  if(track){
    const region = track.closest('[data-carousel-region]') || track.parentElement?.parentElement;
    if(region && !region.hasAttribute('data-carousel-region')) region.setAttribute('data-carousel-region','');
    track.setAttribute('tabindex','0');
    track.addEventListener('keydown',(e)=>{
      if(e.key==='ArrowRight'){ e.preventDefault(); document.querySelector('[data-carousel-next]')?.click(); }
      else if(e.key==='ArrowLeft'){ e.preventDefault(); document.querySelector('[data-carousel-prev]')?.click(); }
    });
  }
  applyTranslations(currentLang);
});

// Persistent cart state (array of {id,name,price,qty})
function loadCart(){
  try { return JSON.parse(localStorage.getItem('cartItems')||'[]'); } catch { return []; }
}
function saveCart(items){ localStorage.setItem('cartItems', JSON.stringify(items)); }
function findCartItem(items,id){ return items.find(i=>i.id===id); }
function cartCount(items){ return items.reduce((a,i)=>a+i.qty,0); }
function updateCartStorage(mutator){
  const items = loadCart();
  mutator(items);
  // Remove zero qty lines
  for(let i=items.length-1;i>=0;i--){ if(items[i].qty<=0) items.splice(i,1); }
  saveCart(items);
  renderCartLines();
  updateCartBadge();
  recalcCart();
  // Mini-cart live refresh
  if(typeof refreshMiniCartPanel === 'function') refreshMiniCartPanel();
}

// -------------- Cart Line Removal Stash (Undo) --------------
let __removedLineStash = null; // { line, expires }
function stashRemovedLine(line){
  __removedLineStash = { line: { ...line }, expires: Date.now() + 7000 };
  try { sessionStorage.setItem('lastRemovedLine', JSON.stringify(__removedLineStash)); } catch {}
}
function restoreStashedLine(){
  if(!__removedLineStash){
    try {
      const raw = sessionStorage.getItem('lastRemovedLine');
      if(raw) __removedLineStash = JSON.parse(raw);
    } catch {}
  }
  if(!__removedLineStash) return false;
  if(Date.now() > __removedLineStash.expires){ __removedLineStash = null; return false; }
  const { line } = __removedLineStash;
  updateCartStorage(items=>{
    const existing = findCartItem(items, line.id);
    if(existing) existing.qty += line.qty; else items.push(line);
  });
  __removedLineStash = null;
  try { sessionStorage.removeItem('lastRemovedLine'); } catch {}
  if(typeof showToast === 'function'){
    const msg = t('toast.restored').replace('{{name}}', line.name);
    showToast(msg, { type:'success', duration:1800 });
  }
  logAnalyticsEvent && logAnalyticsEvent('cart_line_restored', { id: line.id, qty: line.qty, price: line.price });
  return true;
}

document.addEventListener('click',(e)=>{
  const undoBtn = e.target.closest('[data-undo-remove]');
  if(undoBtn){
    e.preventDefault();
    restoreStashedLine();
  }
});

// Pricing summary (mirrors cart page logic ordering: promo -> loyalty -> total)
function getCartPricingSummary(){
  const items = loadCart();
  const subtotal = items.reduce((a,i)=> a + i.price * i.qty, 0);
  const promoCode = getPromoCode();
  let promoDiscount = 0;
  if(promoCode){
    const evald = evaluatePromo(promoCode, subtotal);
    if(evald && evald.valid){ promoDiscount = evald.amount; }
  }
  let loyaltyRedeem = 0;
  try {
    const applied = Number(localStorage.getItem('loyaltyApplied')||'0');
    if(applied>0) loyaltyRedeem = Math.min(applied, subtotal - promoDiscount);
  } catch {}
  const total = Math.max(0, subtotal - promoDiscount - loyaltyRedeem);
  return { subtotal, promoDiscount, loyaltyRedeem, total };
}

// ---------------- Mini-Cart (Floating Panel) ----------------
let __miniCartPanel;
let __miniCartToggle;
function ensureMiniCartPanel(){
  if(__miniCartPanel) return __miniCartPanel;
  // Toggle button (avoid duplication)
  __miniCartToggle = document.querySelector('[data-mini-cart-toggle]');
  if(!__miniCartToggle){
    __miniCartToggle = document.createElement('button');
    __miniCartToggle.type='button';
    __miniCartToggle.setAttribute('data-mini-cart-toggle','');
    __miniCartToggle.className='fixed z-40 bottom-24 right-4 md:right-6 bg-primary text-white rounded-full shadow-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/60 transition';
    __miniCartToggle.innerHTML='<span data-i18n="miniCart.view">'+t('miniCart.view')+'</span>';
    __miniCartToggle.addEventListener('click', toggleMiniCartOpen);
    document.body.appendChild(__miniCartToggle);
  }
  // Panel container
  __miniCartPanel = document.createElement('aside');
  __miniCartPanel.setAttribute('aria-label', t('miniCart.title'));
  __miniCartPanel.setAttribute('data-mini-cart','');
  __miniCartPanel.className='fixed z-50 bottom-4 right-4 md:right-6 w-80 max-h-[70vh] flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl translate-y-4 opacity-0 pointer-events-none transition will-change-transform';
  __miniCartPanel.innerHTML = `
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-sm font-semibold" data-i18n="miniCart.title">${t('miniCart.title')}</h2>
      <button type="button" data-mini-cart-close class="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded p-1" aria-label="Close">✕</button>
    </div>
    <div class="overflow-y-auto flex-1 px-4 py-2 space-y-3 text-sm" data-mini-cart-items></div>
    <div class="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2 text-sm" data-mini-cart-footer>
      <div class="flex justify-between"><span class="font-medium" data-i18n="miniCart.subtotal">${t('miniCart.subtotal')}</span><span data-mini-cart-subtotal class="tabular-nums">0.00</span></div>
      <div class="hidden flex-col gap-1" data-mini-cart-discounts></div>
      <div class="flex justify-between text-sm pt-1 border-t border-gray-100 dark:border-gray-600"><span class="font-semibold" data-i18n="miniCart.total">${t('miniCart.total')}</span><span data-mini-cart-total class="tabular-nums font-semibold">0.00</span></div>
      <a href="cart.html" class="mt-2 block text-center bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/60 transition" data-mini-cart-cta data-i18n="miniCart.view">${t('miniCart.view')}</a>
    </div>`;
  __miniCartPanel.querySelector('[data-mini-cart-close]')?.addEventListener('click', ()=>setMiniCartOpen(false));
  document.body.appendChild(__miniCartPanel);
  // Outside click dismissal
  document.addEventListener('pointerdown',(e)=>{
    if(!__miniCartPanel) return;
    if(!__miniCartPanel.contains(e.target) && !__miniCartToggle.contains(e.target)){
      setMiniCartOpen(false);
    }
  });
  document.addEventListener('keydown',(e)=>{
    if(e.key==='Escape') setMiniCartOpen(false);
  });
  refreshMiniCartPanel();
  return __miniCartPanel;
}
function isMiniCartOpen(){ return __miniCartPanel && __miniCartPanel.classList.contains('!translate-y-0'); }
function setMiniCartOpen(open){
  if(!__miniCartPanel) return;
  if(open){
    __miniCartPanel.classList.add('!translate-y-0','!opacity-100');
    __miniCartPanel.classList.remove('pointer-events-none');
    __miniCartPanel.style.transform='translateY(0)';
    __miniCartPanel.style.opacity='1';
    __miniCartToggle?.setAttribute('aria-expanded','true');
    // Focus first focusable (close button) for accessibility
    const closeBtn = __miniCartPanel.querySelector('[data-mini-cart-close]');
    setTimeout(()=> closeBtn?.focus(), 30);
    logAnalyticsEvent && logAnalyticsEvent('mini_cart_open', {line_count: loadCart().length});
    try { sessionStorage.setItem('miniCartOpen','1'); } catch {}
  } else {
    __miniCartPanel.classList.remove('!translate-y-0','!opacity-100');
    __miniCartPanel.classList.add('pointer-events-none');
    __miniCartPanel.style.transform='translateY(0.75rem)';
    __miniCartPanel.style.opacity='0';
    __miniCartToggle?.setAttribute('aria-expanded','false');
    logAnalyticsEvent && logAnalyticsEvent('mini_cart_close', {});
    try { sessionStorage.removeItem('miniCartOpen'); } catch {}
  }
}
function toggleMiniCartOpen(){ ensureMiniCartPanel(); setMiniCartOpen(!isMiniCartOpen()); }
function refreshMiniCartPanel(){
  if(!__miniCartPanel) return; // not yet init
  const listEl = __miniCartPanel.querySelector('[data-mini-cart-items]');
  const subtotalEl = __miniCartPanel.querySelector('[data-mini-cart-subtotal]');
  const totalEl = __miniCartPanel.querySelector('[data-mini-cart-total]');
  const discountsWrap = __miniCartPanel.querySelector('[data-mini-cart-discounts]');
  const items = loadCart();
  if(!items.length){
    listEl.innerHTML = `<div class="text-gray-500 text-xs" data-i18n="miniCart.empty">${t('miniCart.empty')}</div>`;
    subtotalEl.textContent = '0.00';
    if(totalEl) totalEl.textContent = '0.00';
    if(discountsWrap){ discountsWrap.innerHTML=''; discountsWrap.classList.add('hidden'); }
  } else {
    listEl.innerHTML = items.map(line=>{
      const baseId = line.id.split('__')[0];
      const product = PRODUCT_CATALOG.find(p=>p.id===baseId) || {name:line.name};
      let variantLabel='';
      if(product.options && line.id.includes('__')){
        const vid = line.id.split('__')[1];
        const opt = product.options.find(o=>o.id===vid);
        if(opt) variantLabel = `<span class="block text-[10px] text-gray-500 mt-0.5">${escapeHtml(opt.label || opt.name || '')}</span>`;
      }
      const imgSrc = product.img || 'assets/images/products/default.png';
      const alt = product.altKey ? t(product.altKey) : (product.alt || product.name || '');
      return `<div class="flex items-start gap-3 group">
        <img src="${imgSrc}" alt="${escapeHtml(alt)}" class="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700 bg-white flex-shrink-0" onerror="this.src='assets/images/products/default.png'" />
        <div class="flex-1 min-w-0">
          <p class="font-medium truncate">${escapeHtml(product.name || line.name)}</p>
          ${variantLabel}
          <p class="text-[11px] text-gray-500">${line.qty} × ${(line.price).toFixed(2)}</p>
        </div>
        <div class="flex flex-col items-end gap-1">
          <button type="button" data-mini-cart-inc="${line.id}" class="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50" aria-label="Increase">+</button>
          <button type="button" data-mini-cart-dec="${line.id}" class="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50" aria-label="Decrease">−</button>
          <button type="button" data-mini-cart-remove="${line.id}" class="opacity-0 group-hover:opacity-100 transition text-[10px] text-red-500 hover:text-red-600 focus:opacity-100 focus:outline-none" aria-label="${t('miniCart.ariaRemove').replace('{{name}}', escapeHtml(product.name || line.name))}">${t('miniCart.removeLine')}</button>
        </div>
      </div>`;
    }).join('');
    const pricing = getCartPricingSummary();
    subtotalEl.textContent = pricing.subtotal.toFixed(2);
    if(totalEl) totalEl.textContent = pricing.total.toFixed(2);
    if(discountsWrap){
      const parts = [];
      if(pricing.promoDiscount>0) parts.push(`<div class=\"flex justify-between text-xs text-green-600 dark:text-green-400\"><span data-i18n=\"miniCart.promo\">${t('miniCart.promo')}</span><span>-${pricing.promoDiscount.toFixed(2)}</span></div>`);
      if(pricing.loyaltyRedeem>0) parts.push(`<div class=\"flex justify-between text-xs text-indigo-600 dark:text-indigo-400\"><span data-i18n=\"miniCart.loyalty\">${t('miniCart.loyalty')}</span><span>-${pricing.loyaltyRedeem.toFixed(2)}</span></div>`);
      if(parts.length){
        discountsWrap.innerHTML = parts.join('');
        discountsWrap.classList.remove('hidden');
      } else {
        discountsWrap.innerHTML='';
        discountsWrap.classList.add('hidden');
      }
    }
  }
  // Wire increment/decrement buttons
  listEl.querySelectorAll('[data-mini-cart-inc]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.getAttribute('data-mini-cart-inc');
      updateCartStorage(items=>{ const line=findCartItem(items,id); if(line) line.qty++; });
    }, {once:true});
  });
  listEl.querySelectorAll('[data-mini-cart-dec]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.getAttribute('data-mini-cart-dec');
      updateCartStorage(items=>{ const line=findCartItem(items,id); if(line) line.qty--; });
    }, {once:true});
  });
  listEl.querySelectorAll('[data-mini-cart-remove]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.getAttribute('data-mini-cart-remove');
      let removedLine = null;
      updateCartStorage(items=>{ const idx = items.findIndex(i=>i.id===id); if(idx!==-1){ removedLine = items[idx]; items.splice(idx,1); }});
      if(removedLine){
        stashRemovedLine(removedLine);
        logAnalyticsEvent && logAnalyticsEvent('cart_line_removed', { id: removedLine.id, qty: removedLine.qty, price: removedLine.price });
        if(typeof showToast==='function'){
          const baseMsg = t('toast.undoRemove').replace('{{name}}', removedLine.name);
          showToast(`${baseMsg} <button data-undo-remove class='ml-2 underline font-semibold focus:outline-none'>${t('toast.undo')}</button>`, { type:'error', duration:7000, html:true });
        }
      }
    }, {once:true});
  });
  // Keyboard navigation inside mini-cart
  __miniCartPanel.addEventListener('keydown', (e)=>{
    if(!['ArrowDown','ArrowUp'].includes(e.key)) return;
    const focusables = Array.from(__miniCartPanel.querySelectorAll('button, a')).filter(el=> !el.disabled && el.offsetParent !== null);
    if(!focusables.length) return;
    const currentIndex = focusables.indexOf(document.activeElement);
    const dir = e.key==='ArrowDown' ? 1 : -1;
    const nextIndex = (currentIndex + dir + focusables.length) % focusables.length;
    focusables[nextIndex].focus();
    e.preventDefault();
  }, { once:true });
}
document.addEventListener('DOMContentLoaded', ()=>{
  ensureMiniCartPanel();
  refreshMiniCartPanel();
  try { if(sessionStorage.getItem('miniCartOpen')) setMiniCartOpen(true); } catch {}
});

// ---------- Variant Preference (per product) ----------
// localStorage key: variantPrefs => { [baseProductId]: variantId }
function loadVariantPrefs(){
  try { return JSON.parse(localStorage.getItem('variantPrefs')||'{}'); } catch { return {}; }
}
function saveVariantPrefs(obj){ localStorage.setItem('variantPrefs', JSON.stringify(obj)); }
function getPreferredVariant(baseId){
  const map = loadVariantPrefs();
  return map[baseId] || null;
}
function setPreferredVariant(baseId, variantId){
  if(!baseId) return;
  const map = loadVariantPrefs();
  if(variantId) map[baseId] = variantId; else delete map[baseId];
  saveVariantPrefs(map);
}

// ---------------- Promo Codes ----------------
function getPromoCode(){ return localStorage.getItem('promoCode') || null; }
function setPromoCode(code){ if(code) localStorage.setItem('promoCode', code); else localStorage.removeItem('promoCode'); }
function currentCartSubtotal(){ return loadCart().reduce((a,i)=>a + i.price * i.qty, 0); }
function evaluatePromo(code, subtotal){
  const upper = (code||'').toUpperCase();
  if(!upper) return { valid:false, type:null };
  if(upper === 'SAVE10'){ return { valid:true, type:'percent', value:10 }; }
  if(upper === 'FREESHIP'){ return { valid:true, type:'flat', value:5.00 }; }
  if(upper === 'BIGSPEND15'){
    if(subtotal >= 50) return { valid:true, type:'percent', value:15, min:50 };
    return { valid:false, reason:'min' };
  }
  return { valid:false, reason:'unknown' };
}
function computePromoDiscount(subtotal){
  const code = getPromoCode();
  if(!code) return { code:null, discountValue:0 };
  const res = evaluatePromo(code, subtotal);
  if(!res.valid) return { code:null, discountValue:0 };
  let discount = 0;
  if(res.type === 'percent') discount = subtotal * (res.value/100);
  else if(res.type === 'flat') discount = res.value;
  discount = Math.min(discount, subtotal); // never exceed subtotal
  return { code, discountValue: discount };
}
function updatePromoUI(){
  const code = getPromoCode();
  const input = $('[data-promo-input]');
  const applyBtn = $('[data-promo-apply]');
  const removeBtn = $('[data-promo-remove]');
  const msgEl = $('[data-promo-msg]');
  if(!input || !applyBtn || !removeBtn) return;
  if(code){
    input.value = code;
    applyBtn.classList.add('hidden');
    removeBtn.classList.remove('hidden');
  } else {
    applyBtn.classList.remove('hidden');
    removeBtn.classList.add('hidden');
  }
  // If code invalid due to subtotal drop, reflect it
  if(code){
    const evalRes = evaluatePromo(code, currentCartSubtotal());
    if(!evalRes.valid){
      msgEl.textContent = t('promo.invalid');
      setPromoCode(null);
      applyBtn.classList.remove('hidden');
      removeBtn.classList.add('hidden');
    }
  }
}

// Highlight tab aktif + badge troli + outlet badge
function setActiveTab(){
  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const map = { 'index.html':'home','menu.html':'menu','gift.html':'gift','rewards.html':'rewards','cart.html':'cart','account.html':'account' };
  const key = map[file] || document.body.dataset.page || 'home';
  $$('nav a[data-tab]').forEach(a=>{
    a.removeAttribute('aria-current');
    if(a.dataset.tab === key) a.setAttribute('aria-current', 'page');
  });
  updatePickupOutletBadge();
}
function updateCartBadge(){
  const n = cartCount(loadCart());
  $$('[data-cart-badge]').forEach(el=>{
    el.textContent = n;
    el.classList.toggle('hidden', n <= 0);
  });
}
// Pickup Outlet Badge logic
function updatePickupOutletBadge() {
  const badge = document.getElementById('pickupOutletBadge');
  if (!badge) return;
  const outletId = loadSelectedOutlet();
  const textEl = badge.querySelector('[data-outlet-text]');
  if (outletId) {
    let name = '';
    switch(outletId) {
      case 'outlet-klcc': name = 'KLCC Mall'; break;
      case 'outlet-midvalley': name = 'Mid Valley'; break;
      case 'outlet-penang': name = 'George Town'; break;
      case 'outlet-jb': name = 'Johor Bahru'; break;
      default: name = outletId;
    }
    textEl.textContent = name;
    badge.style.display = '';
  } else {
    textEl.textContent = 'Set pickup outlet';
    badge.style.display = 'none';
  }
}
// Update badge on DOMContentLoaded and when outlet changes
document.addEventListener('DOMContentLoaded', updatePickupOutletBadge);
window.addEventListener('storage', function(e) {
  if (e.key === 'selectedOutlet') updatePickupOutletBadge();
});

// ---------------- Favorites (Wishlist) ----------------
// Product Catalog (for modal + consistent metadata) + categories
const PRODUCT_CATALOG = {
  'prod-nasilemak': { id:'prod-nasilemak', cat:'mains', price:6.90, img:'assets/images/products/nasilemak.jpg', nameKey:'products.prod-nasilemak.name', descKey:'products.prod-nasilemak.desc', altKey:'products.prod-nasilemak.alt', outlets:['outlet-klcc','outlet-midvalley','outlet-penang'],
    options:[
      { id:'std', labelKey:'products.prod-nasilemak.opt.std', delta:0 },
      { id:'addchicken', labelKey:'products.prod-nasilemak.opt.addchicken', delta:3.00 },
      { id:'extra sambal', labelKey:'products.prod-nasilemak.opt.extrasambal', delta:1.00 }
    ]
  },
  'prod-meebandung': { id:'prod-meebandung', cat:'mains', price:9.90, img:'assets/images/products/meebandung.jpg', nameKey:'products.prod-meebandung.name', descKey:'products.prod-meebandung.desc', altKey:'products.prod-meebandung.alt', outlets:['outlet-klcc','outlet-midvalley'] },
  'prod-tehais': { id:'prod-tehais', cat:'drinks', price:3.50, img:'assets/images/products/tehais.jpg', nameKey:'products.prod-tehais.name', descKey:'products.prod-tehais.desc', altKey:'products.prod-tehais.alt', outlets:['outlet-klcc','outlet-midvalley','outlet-penang','outlet-jb'],
    options:[
      { id:'reg', labelKey:'products.prod-tehais.opt.reg', delta:0 },
      { id:'less sugar', labelKey:'products.prod-tehais.opt.lesssugar', delta:0 },
      { id:'large', labelKey:'products.prod-tehais.opt.large', delta:1.50 }
    ]
  },
  'prod-kopilatte': { id:'prod-kopilatte', cat:'drinks', price:7.90, img:'assets/images/products/kopilatte.jpg', nameKey:'products.prod-kopilatte.name', descKey:'products.prod-kopilatte.desc', altKey:'products.prod-kopilatte.alt', outlets:['outlet-midvalley','outlet-penang'] },
};
// Outlet Directory
const OUTLETS = [
  { id:'outlet-klcc', name:'KLCC Mall', city:'Kuala Lumpur', region:'Central', active:true },
  { id:'outlet-midvalley', name:'Mid Valley', city:'Kuala Lumpur', region:'Central', active:true },
  { id:'outlet-penang', name:'George Town', city:'Penang', region:'North', active:true },
  { id:'outlet-jb', name:'Johor Bahru', city:'Johor', region:'South', active:true }
];
function loadSelectedOutlet(){ return localStorage.getItem('selectedOutlet') || null; }
function saveSelectedOutlet(id){ if(id) localStorage.setItem('selectedOutlet', id); else localStorage.removeItem('selectedOutlet'); }
const PRODUCT_CATEGORIES = [
  { id:'all', nameKey:'categories.all' },
  { id:'mains', nameKey:'categories.mains' },
  { id:'drinks', nameKey:'categories.drinks' },
];
function loadFavorites(){
  try { return JSON.parse(localStorage.getItem('favorites')||'[]'); } catch { return []; }
}
function saveFavorites(arr){ localStorage.setItem('favorites', JSON.stringify(arr)); }
function isFavorite(id){ return loadFavorites().includes(id); }
function toggleFavorite(id){
  const favs = loadFavorites();
  const i = favs.indexOf(id);
  if(i>=0) favs.splice(i,1); else favs.push(id);
  saveFavorites(favs);
  applyFavoritesState();
}
function applyFavoritesState(){
  const favs = new Set(loadFavorites());
  $$('[data-fav-toggle]').forEach(btn=>{
    const id = btn.getAttribute('data-id');
    const active = id && favs.has(id);
    btn.dataset.active = active ? 'true' : 'false';
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.setAttribute('aria-label', active ? t('favorites.remove') : t('favorites.add'));
  });
  // Filter mode
  const filterOn = localStorage.getItem('favoritesFilter') === '1';
  const grid = document.querySelector('[data-products-grid]');
  if(grid){
    grid.querySelectorAll('[data-item-card]').forEach(card=>{
      if(!filterOn){ card.classList.remove('hidden'); return; }
      const id = card.getAttribute('data-id');
      card.classList.toggle('hidden', !id || !favs.has(id));
    });
    const emptyMsg = grid.querySelector('[data-favorites-empty]');
    if(emptyMsg){
      if(filterOn){
        // show only if all product cards hidden
        const anyVisible = !![...grid.querySelectorAll('[data-item-card]')].find(c=>!c.classList.contains('hidden'));
        emptyMsg.classList.toggle('hidden', anyVisible);
      } else {
        emptyMsg.classList.add('hidden');
      }
    }
  }
  // Update filter toggle visual state
  const filterBtn = document.querySelector('[data-favorites-filter]');
  if(filterBtn){
    filterBtn.dataset.active = filterOn ? 'true' : 'false';
    filterBtn.setAttribute('aria-pressed', filterOn ? 'true':'false');
  }
}

// Render product cards dynamically (menu page)
function renderProductGrid(){
  const __gridStart = performance.now();
  const grid = document.querySelector('[data-products-grid]');
  if(!grid) return;
  // If skeleton wrapper present, remove it on first real render
  const skeleton = grid.querySelector('[data-skeleton-cards]');
  if(skeleton){ skeleton.remove(); grid.removeAttribute('data-products-skeleton'); }
  // Ensure a hidden live region exists for announcing search results
  let liveRegion = document.getElementById('search-results-announcer');
  if(!liveRegion){
    liveRegion = document.createElement('div');
    liveRegion.id = 'search-results-announcer';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live','polite');
    liveRegion.setAttribute('aria-atomic','true');
    document.body.appendChild(liveRegion);
  }
  // Wipe before re-render to support category switching
  grid.querySelectorAll('[data-item-card]').forEach(el=>el.remove());
  const emptyPlaceholder = grid.querySelector('[data-favorites-empty]');
  const frag = document.createDocumentFragment();
  const activeCat = localStorage.getItem('activeCategory') || 'all';
  const query = (localStorage.getItem('searchQuery')||'').toLowerCase();
  let matches = Object.values(PRODUCT_CATALOG).filter(p=> activeCat==='all' || p.cat===activeCat);
  const selectedOutlet = loadSelectedOutlet();
  if(selectedOutlet){
    matches = matches.filter(p=> !p.outlets || p.outlets.includes(selectedOutlet));
  }
  // Outlet filter banner management
  (function(){
    const banner = document.querySelector('[data-outlet-filter-banner]');
    if(!banner) return;
    const totalAll = Object.values(PRODUCT_CATALOG).filter(p=> activeCat==='all' || p.cat===activeCat).filter(p=> !((localStorage.getItem('searchQuery')||'') && !t(p.nameKey).toLowerCase().includes((localStorage.getItem('searchQuery')||'').toLowerCase()))).length;
    if(selectedOutlet && matches.length < totalAll){
      banner.classList.remove('hidden');
      const outlet = OUTLETS.find(o=>o.id===selectedOutlet);
      const text = t('outlet.filteredNotice')
        .replace('{shown}', matches.length)
        .replace('{total}', totalAll)
        .replace('{name}', outlet? outlet.name : '—');
      banner.querySelector('[data-outlet-filter-text]').textContent = text;
    } else {
      banner.classList.add('hidden');
    }
  })();
  if(query){
    matches = matches.filter(p=> t(p.nameKey).toLowerCase().includes(query));
  }
  const queryRaw = localStorage.getItem('searchQuery')||'';
  matches.forEach(p=>{
    const card = document.createElement('article');
    card.className = 'relative group rounded-xl ring-1 ring-gray-200 bg-white p-3 hover:ring-gray-300 transition';
    card.setAttribute('data-item-card','');
    card.setAttribute('data-id', p.id);
    // Name (with optional highlight)
    let nameHtml = t(p.nameKey);
    if(query && queryRaw){
      const idx = nameHtml.toLowerCase().indexOf(query);
      if(idx>=0){
        const before = nameHtml.slice(0, idx);
        const match = nameHtml.slice(idx, idx+query.length);
        const after = nameHtml.slice(idx+query.length);
        nameHtml = `${before}<mark class="bg-amber-200/80 text-amber-900 px-0.5 rounded-sm">${match}</mark>${after}`;
      }
    }
    // Use altKey for translation lookup, fallback to nameKey, then product name
    let altText = '';
    if(p.altKey && TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].alt && TRANSLATIONS[currentLang].alt[p.altKey]){
      altText = t(`alt.${p.altKey}`);
    } else if(p.nameKey) {
      altText = t(p.nameKey);
    } else {
      altText = p.name || '';
    }
    const imgHtml = p.img ? `<img src="${p.img}" alt="${altText}" loading="lazy" decoding="async" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove();this.closest('[data-imgwrap]').classList.add('fallback');"/>` : '';
    const nameId = `prod-name-${p.id}`;
    card.setAttribute('aria-labelledby', nameId);
    card.innerHTML = `
      <button type="button" data-fav-toggle data-id="${p.id}" aria-pressed="false" aria-label="${t('favorites.add')}" class="absolute top-2 right-2 w-8 h-8 rounded-full grid place-items-center bg-white/80 backdrop-blur ring-1 ring-gray-300 text-gray-500 data-[active=true]:text-red-500" data-active="false">❤</button>
      <button type="button" data-product-open="${p.id}" class="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
        <div data-imgwrap class="aspect-square rounded-lg bg-gray-100 grid place-items-center text-gray-400 overflow-hidden relative">
          ${imgHtml || '<span class="text-[10px] opacity-60">img</span>'}
        </div>
        <div id="${nameId}" class="mt-2 text-sm font-medium truncate" data-product-name data-i18n="${p.nameKey}">${nameHtml}</div>
        <div class="mt-1 text-base font-semibold">${fmtRM(p.price)}</div>
      </button>
      <div class="mt-2 flex gap-2">
        <button type="button" data-product-open="${p.id}" class="flex-1 text-[11px] font-semibold px-2 py-1 rounded-full ring-1 ring-gray-300 hover:bg-gray-50" data-i18n="orders.toggle.show">Details</button>
        <button type="button" data-quick-add="${p.id}" class="w-9 h-8 rounded-full ring-1 ring-gray-300 hover:bg-gray-50 text-sm font-semibold" aria-label="Add to cart">+</button>
      </div>`;
    frag.appendChild(card);
  });
  if(emptyPlaceholder) grid.insertBefore(frag, emptyPlaceholder); else grid.appendChild(frag);
  // Toggle search empty state
  const searchEmpty = grid.querySelector('[data-search-empty]');
  if(searchEmpty){
    const showSearchEmpty = (query && matches.length===0);
    searchEmpty.classList.toggle('hidden', !showSearchEmpty);
  }
  // Announce results to assistive tech (debounced via rAF to ensure DOM settled)
  requestAnimationFrame(()=>{
    if(!query){
      liveRegion.textContent = '';
    } else {
      liveRegion.textContent = matches.length === 0 ? t('search.none') || 'No results' : (t('search.count') ? t('search.count').replace('{{count}}', matches.length) : `${matches.length} results`);
    }
  });
  applyTranslations(currentLang);
  applyFavoritesState();
  if(window.__analytics){
    const ms = Math.round(performance.now() - __gridStart);
    window.__analytics.log('perf_render_product_grid', { ms, count: matches.length });
  }
}

// Global image error fallback (delegated) for any product image wrapper
document.addEventListener('error', (e)=>{
  const target = e.target;
  if(!(target instanceof HTMLImageElement)) return;
  const wrap = target.closest('[data-imgwrap]');
  if(wrap && !target.dataset.fallback){
    target.remove();
    wrap.classList.add('fallback');
    const ph = document.createElement('div');
    ph.className='w-full h-full flex items-center justify-center text-[10px] text-gray-400';
    ph.innerHTML = 'Offline';
    wrap.appendChild(ph);
  }
}, true);

function renderCategoryBar(){
  const bar = document.querySelector('[data-category-bar]');
  if(!bar) return;
  bar.innerHTML='';
  const active = localStorage.getItem('activeCategory') || 'all';
  PRODUCT_CATEGORIES.forEach(cat=>{
    const btn = document.createElement('button');
    btn.type='button';
    btn.dataset.category = cat.id;
    btn.className = 'px-4 py-1.5 rounded-full text-[12px] font-semibold ring-1 ring-gray-300 whitespace-nowrap data-[active=true]:bg-blue-600 data-[active=true]:text-white';
    btn.setAttribute('data-i18n', cat.nameKey);
    btn.textContent = t(cat.nameKey);
    if(cat.id === active) btn.dataset.active='true'; else btn.dataset.active='false';
    bar.appendChild(btn);
  });
  applyTranslations(currentLang);
}

document.addEventListener('click',(e)=>{
  const catBtn = e.target.closest('[data-category-bar] [data-category]');
  if(catBtn){
    const id = catBtn.getAttribute('data-category');
    localStorage.setItem('activeCategory', id);
    renderCategoryBar();
    renderProductGrid();
  }
});

// Quick add one unit without opening modal
document.addEventListener('click', e => {
  const quickBtn = e.target.closest('[data-quick-add]');
  if(quickBtn){
    const id = quickBtn.getAttribute('data-quick-add');
    const p = PRODUCT_CATALOG[id];
    if(p){
      let unitPrice = p.price;
      let compositeId = p.id;
      let variantLabel = '';
      if(p.options && p.options.length){
        const preferred = getPreferredVariant(p.id);
        const chosen = preferred ? p.options.find(o=>o.id===preferred) : p.options[0];
        if(chosen){
          compositeId = `${p.id}__${chosen.id}`;
          unitPrice += chosen.delta || 0;
          variantLabel = t(`${p.nameKey}.opt.${chosen.id}`) || chosen.id;
        }
      }
      const displayName = variantLabel ? `${t(p.nameKey)} (${variantLabel})` : t(p.nameKey);
      updateCartStorage(items => {
        let line = findCartItem(items, compositeId);
        const variantId = (variantLabel && p.options && p.options.length) ? (getPreferredVariant(p.id) || p.options[0].id) : '';
        if(!line) items.push({ id:compositeId, baseId:p.id, variant:variantId, name:displayName, price:unitPrice, qty:1 });
        else line.qty += 1;
      });
      showToast(t('toast.cartAdded').replace('{{name}}', displayName));
      if(window.__analytics){
        window.__analytics.log('cart_add', { productId: p.id, variantId: (variantLabel ? (getPreferredVariant(p.id) || (p.options && p.options[0]?.id) || null) : null), qty:1, unitPrice, total: unitPrice, source: 'quick-add' });
      }
    }
  }
});

// Event delegation for favorites toggles & filter
document.addEventListener('click',(e)=>{
  const favBtn = e.target.closest('[data-fav-toggle]');
  if(favBtn){
    const id = favBtn.getAttribute('data-id');
    if(id){ toggleFavorite(id); }
  }
  const filterBtn = e.target.closest('[data-favorites-filter]');
  if(filterBtn){
    const current = localStorage.getItem('favoritesFilter') === '1';
    localStorage.setItem('favoritesFilter', current ? '0' : '1');
    applyFavoritesState();
    applyTranslations(currentLang); // refresh aria-labels
  }
});

// Add to cart (butang pada Menu) - uses data-item attributes
document.addEventListener('click', (e)=>{
  const add = e.target.closest('[data-add-to-cart]');
  if(add){
    const card = add.closest('[data-item]');
    if(!card) return;
    const id = card.dataset.id;
    const name = card.dataset.name || 'Item';
    const price = Number(card.dataset.price||0);
    updateCartStorage(items=>{
      let line = findCartItem(items,id);
      if(!line){ items.push({id,name,price,qty:1}); }
      else { line.qty += 1; }
    });
  }
});

// Cart page: kira subtotal/total + qty control
function recalcCart(){
  const items = loadCart();
  let subtotal = items.reduce((a,i)=>a + i.price * i.qty, 0);
  const { discountValue } = computePromoDiscount(subtotal);
  const discountRow = $('[data-discount-row]');
  if(discountRow){
    discountRow.classList.toggle('hidden', discountValue <= 0);
    if(discountValue > 0){
      $('#discount').textContent = '−' + fmtRM(discountValue).replace('RM','RM');
    }
  }
  // Loyalty redemption (after promo discount, before tax)
  let subtotalAfterPromo = Math.max(0, subtotal - discountValue);
  let redeemedPoints = loadRedeemedPoints();
  // Clamp redeemed points to max possible given current subtotal
  const maxRedeemableNow = computeMaxRedeemablePoints(subtotalAfterPromo);
  if(redeemedPoints > maxRedeemableNow){
    redeemedPoints = maxRedeemableNow;
    saveRedeemedPoints(redeemedPoints);
  }
  const loyaltyDiscount = loyaltyDiscountFromPoints(redeemedPoints);
  const taxedBase = Math.max(0, subtotalAfterPromo - loyaltyDiscount);
  const tax = items.length ? 8.00 : 0.00;
  $('#subtotal')?.textContent = fmtRM(subtotal);
  $('#tax')?.textContent = fmtRM(tax);
  $('#total')?.textContent = fmtRM(taxedBase + tax);
  // Update loyalty UI if present
  updateLoyaltyCartUI({subtotal, discountValue, loyaltyDiscount, redeemedPoints, maxRedeemableNow});
}

// Render cart lines on cart page
function renderCartLines(){
  const container = $('[data-cart-lines]');
  if(!container) return; // not on cart page
  const items = loadCart();
  container.innerHTML = '';
  if(items.length === 0){
    $('[data-empty-cart]')?.classList.remove('hidden');
  } else {
    $('[data-empty-cart]')?.classList.add('hidden');
  }
  items.forEach(item=>{
    const line = document.createElement('article');
    line.className = 'grid grid-cols-[64px_1fr_auto] gap-3 items-center bg-white dark:bg-slate-800/60 dark:border dark:border-slate-700 rounded-xl p-3 shadow-soft';
    line.dataset.line = '';
    line.dataset.id = item.id;
    line.dataset.price = item.price;
    line.innerHTML = `
      <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200"></div>
      <div class="grid gap-1">
        <div class="font-bold">${item.name}</div>
        <div class="text-[12px] text-muted">Qty x ${item.qty}</div>
      </div>
      <div class="text-right grid gap-2">
        <div class="font-extrabold">${fmtRM(item.price * item.qty)}</div>
        <div class="inline-grid grid-flow-col gap-2 items-center bg-[#f6f8fb] dark:bg-slate-700/40 border border-ring dark:border-slate-600 rounded-full px-2 py-1">
          <button data-dec class="w-6 h-6 rounded-full bg-white dark:bg-slate-200 shadow text-slate-700 dark:text-slate-900 font-semibold">−</button>
          <span data-count class="min-w-4 text-center">${item.qty}</span>
          <button data-inc class="w-6 h-6 rounded-full bg-white dark:bg-slate-200 shadow text-slate-700 dark:text-slate-900 font-semibold">+</button>
        </div>
      </div>
      <button data-remove class="col-span-3 justify-self-end mt-2 text-[13px] px-3 py-1 rounded-lg bg-red-50 dark:bg-red-400/10 text-red-500 dark:text-red-300 border border-red-200 dark:border-red-400/30">Buang</button>
    `;
    container.appendChild(line);
  });
}

// Cart actions
document.addEventListener('click', (e)=>{
  const inc = e.target.closest('[data-inc]');
  const dec = e.target.closest('[data-dec]');
  const rm  = e.target.closest('[data-remove]');
  const clear = e.target.closest('[data-clear-cart]');
  const applyBtn = e.target.closest('[data-promo-apply]');
  const removeBtn = e.target.closest('[data-promo-remove]');
  if(inc || dec){
    const line = e.target.closest('[data-line]');
    if(!line) return;
    const id = line.dataset.id;
    updateCartStorage(items=>{
      const it = findCartItem(items,id); if(!it) return;
      if(inc) it.qty += 1; else it.qty = Math.max(0, it.qty - 1);
    });
    // Aggregated quantity delta toast (debounced)
    try {
      const name = line.querySelector('.font-bold')?.textContent || 'Item';
      window.__bufferedQtyToast?.(id, name, inc ? 1 : -1);
    } catch {}
  }
  if(rm){
    const line = e.target.closest('[data-line]');
    if(!line) return;
    const id = line.dataset.id;
    updateCartStorage(items=>{
      const idx = items.findIndex(i=>i.id===id);
      if(idx>=0) items.splice(idx,1);
    });
    try {
      const name = line.querySelector('.font-bold')?.textContent || 'Item';
      showToast(t('toast.cartRemoved').replace('{{name}}', name), { type:'error', duration:1500 });
    } catch {}
  }
  if(clear){
    updateCartStorage(items=>{ items.splice(0, items.length); });
    showToast('Cart cleared', { type:'info' });
  }
  if(applyBtn){
    const input = $('[data-promo-input]');
    const raw = (input.value||'').trim().toUpperCase();
    setPromoCode(raw || null);
    const msgEl = $('[data-promo-msg]');
    if(raw){
      const { valid } = evaluatePromo(raw, currentCartSubtotal());
      if(!valid){
        msgEl.textContent = t('promo.invalid');
        setPromoCode(null);
        showToast(t('promo.invalid'), { type:'error' });
      } else { msgEl.textContent = t('promo.applied'); }
    } else { msgEl.textContent=''; }
    updatePromoUI();
    recalcCart();
    if(raw && getPromoCode()){ showToast(t('promo.applied'), { type:'success' }); }
  }
  if(removeBtn){
    setPromoCode(null);
    const msgEl = $('[data-promo-msg]');
    msgEl.textContent='';
    updatePromoUI();
    recalcCart();
    showToast('Promo removed', { type:'info' });
  }
  const applyLoyalty = e.target.closest('[data-loyalty-apply]');
  if(applyLoyalty){
    const items = loadCart();
    if(!items.length) return; // nothing to apply
    const subtotal = items.reduce((a,i)=>a + i.price * i.qty, 0);
    const { discountValue } = computePromoDiscount(subtotal);
    const afterPromo = Math.max(0, subtotal - discountValue);
    const maxPts = computeMaxRedeemablePoints(afterPromo);
    if(maxPts > 0){ saveRedeemedPoints(maxPts); }
    recalcCart();
    if(maxPts>0) showToast('Applied loyalty discount', { type:'success' });
  }
  const clearLoyalty = e.target.closest('[data-loyalty-clear]');
  if(clearLoyalty){
    clearRedeemedPoints();
    recalcCart();
    showToast('Cleared loyalty', { type:'info' });
  }
});

// Init
document.addEventListener('DOMContentLoaded', ()=>{
  // Initialize skeleton placeholders if product grid is slow
  (function initSkeleton(){
    const skSection = document.querySelector('[data-skeleton]');
    if(!skSection) return;
    const tpl = skSection.querySelector('#skeleton-item-template');
    if(!tpl) return;
    // Populate with fixed number of placeholders
    for(let i=0;i<6;i++){
      const frag = tpl.content.cloneNode(true);
      skSection.appendChild(frag);
    }
    skSection.dataset.active = '1';
  })();

  setActiveTab();
  renderCartLines();
  updateCartBadge();
  recalcCart();
  applyFavoritesState();
  updatePromoUI();
  renderCategoryBar();
  // Restore search query
  const searchInput = document.querySelector('[data-search-input]');
  if(searchInput){
    const q = localStorage.getItem('searchQuery')||'';
    if(q){ searchInput.value = q; }
    updateSearchClearBtn();
  }
  renderProductGrid();
  // After product grid rendered (async defer by microtask), hide skeleton
  queueMicrotask(()=>{
    const skSection = document.querySelector('[data-skeleton]');
    const grid = document.querySelector('[data-product-grid]');
    if(skSection && grid && grid.children.length){
      skSection.remove();
    }
  });
  // Theme init
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
  const toggleBtn = document.querySelector('[data-theme-toggle]');
  if(toggleBtn){
    toggleBtn.addEventListener('click', ()=>{
      const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('theme', next);
      updateToggleLabel(toggleBtn, next);
      window.showToast?.(next === 'dark' ? 'Dark mode on' : 'Light mode on', { type:'info', duration:1800 });
    });
    updateToggleLabel(toggleBtn, theme);
  }
  // Welcome toast (only first visit in session)
  if(!sessionStorage.getItem('welcomed')){
    window.showToast?.('Welcome back 👋', { type:'success', duration:2500 });
    sessionStorage.setItem('welcomed','1');
  }
});

function applyTheme(mode){
  const root = document.documentElement; // use <html>
  root.classList.toggle('dark', mode === 'dark');
  document.body.classList.toggle('dark', mode === 'dark');
}

function updateToggleLabel(btn, mode){
  if(!btn) return;
  if(mode === 'dark'){
    btn.textContent = '☀️ ' + t('theme.light');
  } else {
    btn.textContent = '🌙 ' + t('theme.dark');
  }
  btn.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
  btn.setAttribute('role','button');
}

// ---- Loyalty Cart UI ----
function ensureLoyaltyCartMarkup(){
  const promoArea = document.querySelector('[data-promo-area]');
  if(!promoArea) return;
  if(document.querySelector('[data-loyalty-area]')) return; // already inserted
  const wrap = document.createElement('div');
  wrap.className = 'mt-4 grid gap-2';
  wrap.setAttribute('data-loyalty-area','');
  wrap.innerHTML = `
    <label class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2">
      <span data-i18n="loyalty.label">Loyalty Points</span>
    </label>
    <div class="flex flex-col gap-1 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/40 p-3">
      <div class="flex justify-between text-xs">
        <span data-i18n="loyalty.balance">Balance</span>
        <span data-loyalty-balance class="font-semibold">0</span>
      </div>
      <div class="flex justify-between text-xs">
        <span data-i18n="loyalty.applied">Applied</span>
        <span data-loyalty-applied class="font-semibold">0</span>
      </div>
      <div class="flex gap-2 mt-2">
        <button type="button" data-loyalty-apply class="flex-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40" data-i18n="loyalty.apply">Apply Max</button>
        <button type="button" data-loyalty-clear class="px-3 py-2 rounded-xl bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-100 text-sm font-semibold hidden" data-i18n="loyalty.clear">Clear</button>
      </div>
      <p data-loyalty-msg class="text-[11px] min-h-[14px] text-slate-500 dark:text-slate-400"></p>
    </div>`;
  promoArea.after(wrap);
}

function updateLoyaltyCartUI(ctx){
  ensureLoyaltyCartMarkup();
  const area = document.querySelector('[data-loyalty-area]');
  if(!area) return;
  const balanceEl = area.querySelector('[data-loyalty-balance]');
  const appliedEl = area.querySelector('[data-loyalty-applied]');
  const applyBtn = area.querySelector('[data-loyalty-apply]');
  const clearBtn = area.querySelector('[data-loyalty-clear]');
  const msgEl = area.querySelector('[data-loyalty-msg]');
  const balance = loadLoyaltyPoints();
  const redeemedPoints = loadRedeemedPoints();
  if(balanceEl) balanceEl.textContent = balance + ' pts';
  if(appliedEl) appliedEl.textContent = redeemedPoints + ' pts';
  if(clearBtn) clearBtn.classList.toggle('hidden', redeemedPoints <= 0);
  if(applyBtn){
    const maxRedeemable = ctx?.maxRedeemableNow ?? 0;
    applyBtn.disabled = maxRedeemable <= 0;
  }
  if(msgEl){
    if(redeemedPoints>0){
      msgEl.textContent = t('loyalty.msg.applied').replace('{{amount}}', fmtRM(loyaltyDiscountFromPoints(redeemedPoints)));
    } else {
      msgEl.textContent = '';
    }
  }
  // Re-translate any newly inserted labels
  applyTranslations(currentLang);
}

// ---------- Product Detail Modal (scaffold) ----------
let activeProductId = null;
let lastFocusedBeforeModal = null;

function ensureProductModal(){
  let modal = document.querySelector('[data-product-modal]');
  if(modal) return modal;
  modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-40 hidden';
  modal.setAttribute('data-product-modal','');
  modal.innerHTML = `
    <div data-modal-overlay class="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 transition-opacity" aria-hidden="true"></div>
    <div data-modal-panel role="dialog" aria-modal="true" aria-labelledby="product-modal-title" aria-describedby="product-modal-desc" class="absolute inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] w-full rounded-t-3xl md:rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-gray-200 dark:border-slate-700 transform translate-y-full md:translate-y-0 md:scale-95 opacity-0 transition-all">
      <div class="p-5 grid gap-4">
        <div class="flex items-start justify-between gap-4">
          <h2 id="product-modal-title" data-modal-title class="text-lg font-bold leading-tight"></h2>
          <button type="button" data-modal-close aria-label="Close" class="w-9 h-9 rounded-full grid place-items-center bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600">✕</button>
        </div>
        <div id="product-modal-desc" data-modal-body class="text-sm text-gray-600 dark:text-slate-300 leading-relaxed"></div>
        <div class="grid gap-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium" data-i18n="modal.qty">Quantity</span>
            <div class="inline-grid grid-flow-col gap-2 items-center bg-gray-100 dark:bg-slate-700/50 rounded-full px-2 py-1">
              <button type="button" data-modal-dec class="w-7 h-7 rounded-full bg-white dark:bg-slate-600 shadow text-slate-700 dark:text-slate-100 font-semibold">−</button>
              <span data-modal-qty class="min-w-6 text-center font-semibold">1</span>
              <button type="button" data-modal-inc class="w-7 h-7 rounded-full bg-white dark:bg-slate-600 shadow text-slate-700 dark:text-slate-100 font-semibold">+</button>
            </div>
          </div>
          <button type="button" data-modal-add class="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 text-sm tracking-wide shadow disabled:opacity-50" disabled data-i18n="modal.add">Add to Cart</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

function openProductModal(id){
  const product = PRODUCT_CATALOG[id];
  if(!product) return;
  const modal = ensureProductModal();
  activeProductId = id;
  lastFocusedBeforeModal = document.activeElement;
  const titleEl = modal.querySelector('[data-modal-title]');
  const bodyEl = modal.querySelector('[data-modal-body]');
  const qtyEl = modal.querySelector('[data-modal-qty]');
  const addBtn = modal.querySelector('[data-modal-add]');
  qtyEl.textContent = '1';
  addBtn.disabled = false;
  titleEl.setAttribute('data-i18n', product.nameKey);
  bodyEl.setAttribute('data-i18n', product.descKey);
  // Inject image (top) if available, with alt text from translations (fallback to name)
  let imgBlock = '';
  if(product.img){
    // Use altKey for translation lookup, fallback to nameKey, then product name
    let altText = '';
    if(product.altKey && TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].alt && TRANSLATIONS[currentLang].alt[product.altKey]){
      altText = t(`alt.${product.altKey}`);
    } else if(product.nameKey) {
      altText = t(product.nameKey);
    } else {
      altText = product.name || '';
    }
    imgBlock = `<div class="w-full aspect-video rounded-xl bg-gray-100 overflow-hidden relative"><img src="${product.img}" alt="${altText}" loading="lazy" decoding="async" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove();" /></div>`;
  }
  // Options block if product has variants
  let optionsBlock = '';
  if(product.options && product.options.length){
    const preferred = getPreferredVariant(product.id);
    const opts = product.options.map((opt,i)=>{
      const label = t(`${product.nameKey}.opt.${opt.id}`) || t(opt.labelKey) || opt.id;
      const checked = preferred ? (preferred === opt.id) : (i===0);
      return `<label class="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50">
        <input type="radio" name="modal-option" value="${opt.id}" ${checked?'checked':''} class="accent-blue-600" />
        <span class="text-sm flex-1">${label}${opt.delta?` <span class='text-xs text-gray-500'>(+${fmtRM(opt.delta)})</span>`:''}</span>
      </label>`;
    }).join('');
    optionsBlock = `<div class="grid gap-2 mt-3" data-modal-options>${opts}</div>`;
  }
  bodyEl.innerHTML = imgBlock + `<p data-i18n="${product.descKey}">${t(product.descKey)}</p>` + optionsBlock;
  // Update add button label with dynamic price (base + delta)
  function refreshAddLabel(){
    const qty = Number(qtyEl.textContent)||1;
    let base = product.price;
    let optId = null;
    if(product.options && product.options.length){
      const sel = modal.querySelector('input[name="modal-option"]:checked');
      if(sel){
        optId = sel.value;
        const def = product.options.find(o=>o.id===optId);
        if(def) base += def.delta || 0;
      }
    }
    const total = base * qty;
    addBtn.textContent = t('modal.add') + ' • ' + fmtRM(total);
    addBtn.dataset.variant = optId || '';
  }
  refreshAddLabel();
  modal.querySelectorAll('input[name="modal-option"]').forEach(r=>{
    r.addEventListener('change', e=> {
      const val = e.target.value;
      setPreferredVariant(product.id, val);
      refreshAddLabel();
    });
  });
  // Hook qty buttons to refresh label
  const origInc = modal.querySelector('[data-modal-inc]');
  const origDec = modal.querySelector('[data-modal-dec]');
  [origInc, origDec].forEach(btn=> btn && btn.addEventListener('click', ()=> setTimeout(refreshAddLabel,0)));
  applyTranslations(currentLang); // ensure modal UI labels translated (names/descriptions)
  // Mark background inert for SR/AT while modal open (non-destructive fallback if unsupported)
  document.querySelectorAll('body > *:not([data-product-modal])').forEach(el=>{
    if(el !== modal) el.setAttribute('aria-hidden','true');
  });
  modal.classList.remove('hidden');
  requestAnimationFrame(()=>{
    modal.querySelector('[data-modal-overlay]').classList.remove('opacity-0');
    const panel = modal.querySelector('[data-modal-panel]');
    panel.classList.remove('opacity-0','translate-y-full','md:scale-95');
    // Focus first focusable control (close button) else panel
    const firstFocusable = panel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    (firstFocusable||panel).focus();
  });
  document.body.style.overflow='hidden';
  enableModalFocusTrap();
  // Deep link pushState
  try {
    const url = new URL(location.href);
    url.searchParams.set('product', id);
    history.pushState({ product:id }, '', url.toString());
  } catch {}
}

function closeProductModal(){
  const modal = document.querySelector('[data-product-modal]');
  if(!modal || modal.classList.contains('hidden')) return;
  modal.querySelector('[data-modal-overlay]')?.classList.add('opacity-0');
  const panel = modal.querySelector('[data-modal-panel]');
  panel.classList.add('opacity-0','translate-y-full');
  setTimeout(()=>{ modal.classList.add('hidden'); },200);
  document.body.style.overflow='';
  // Restore background aria-hidden removal
  document.querySelectorAll('body > *[aria-hidden="true"]:not([data-product-modal])').forEach(el=>{
    el.removeAttribute('aria-hidden');
  });
  if(lastFocusedBeforeModal){ try { lastFocusedBeforeModal.focus(); } catch {}
  }
  activeProductId = null;
  disableModalFocusTrap();
  // Remove product param
  try {
    const url = new URL(location.href);
    if(url.searchParams.has('product')){
      url.searchParams.delete('product');
      history.pushState({}, '', url.toString());
    }
  } catch {}
}

document.addEventListener('click',(e)=>{
  const openBtn = e.target.closest('[data-product-open]');
  if(openBtn){
    const id = openBtn.getAttribute('data-product-open');
    if(id) openProductModal(id);
  }
  if(e.target.closest('[data-modal-close]') || e.target.matches('[data-modal-overlay]')){
    closeProductModal();
  }
  if(e.target.closest('[data-modal-inc]')){
    const qtyEl = document.querySelector('[data-modal-qty]');
    qtyEl.textContent = String(Math.min(99, (Number(qtyEl.textContent)||1)+1));
  }
  if(e.target.closest('[data-modal-dec]')){
    const qtyEl = document.querySelector('[data-modal-qty]');
    qtyEl.textContent = String(Math.max(1, (Number(qtyEl.textContent)||1)-1));
  }
  if(e.target.closest('[data-modal-add]')){
    if(!activeProductId) return;
    const product = PRODUCT_CATALOG[activeProductId];
    const qty = Number(document.querySelector('[data-modal-qty]').textContent)||1;
    const modal = document.querySelector('[data-product-modal]');
    let variantId = '';
    let unitPrice = product.price;
    if(product.options && product.options.length){
      const sel = modal?.querySelector('input[name="modal-option"]:checked');
      if(sel){
        variantId = sel.value;
        const def = product.options.find(o=>o.id===variantId);
        if(def) unitPrice += def.delta || 0;
      }
    }
    const compositeId = variantId ? `${product.id}__${variantId}` : product.id;
    const variantLabel = variantId ? (t(`${product.nameKey}.opt.${variantId}`) || variantId) : '';
    updateCartStorage(items=>{
      let line = findCartItem(items, compositeId);
      const displayName = variantLabel ? `${t(product.nameKey)} (${variantLabel})` : t(product.nameKey);
      if(!line){ items.push({id:compositeId, baseId:product.id, variant:variantId, name: displayName, price: unitPrice, qty}); }
      else { line.qty += qty; }
    });
    if(window.__analytics){
      window.__analytics.log('cart_add', { productId: product.id, variantId: variantId || null, qty, unitPrice, total: unitPrice * qty, source: 'modal' });
    }
    // Toast feedback (single vs multi)
    if(window.showToast){
      if(qty > 1){
        const tpl = t('toast.cartAddedMulti');
        const disp = variantLabel ? `${t(product.nameKey)} (${variantLabel})` : t(product.nameKey);
        showToast(tpl.replace('{{name}}', disp).replace('{{n}}', String(qty)), { type:'success' });
      } else {
        const tpl = t('toast.cartAdded');
        const disp = variantLabel ? `${t(product.nameKey)} (${variantLabel})` : t(product.nameKey);
        showToast(tpl.replace('{{name}}', disp), { type:'success' });
      }
    }
    closeProductModal();
  }
});

document.addEventListener('keydown',(e)=>{
  if(e.key === 'Escape') closeProductModal();
});

// Focus trap management
let trapHandler = null;
function enableModalFocusTrap(){
  disableModalFocusTrap(); // clear previous
  trapHandler = (e)=>{
    if(e.key !== 'Tab') return;
    const modal = document.querySelector('[data-product-modal]:not(.hidden)');
    if(!modal) return;
    const panel = modal.querySelector('[data-modal-panel]');
    const focusables = [...panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el=>!el.hasAttribute('disabled'));
    if(!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', trapHandler, true);
}
function disableModalFocusTrap(){
  if(trapHandler){ document.removeEventListener('keydown', trapHandler, true); trapHandler = null; }
}

// ---- Order History (Last Order) ----
// Storage key: orderHistory (array of order objects)
// Order: { id: string, created: number (ms), mode: 'delivery'|'pickup', items: [{id,name,price,qty}], subtotal, tax, total }

function loadOrderHistory(){
  try { return JSON.parse(localStorage.getItem('orderHistory')||'[]'); } catch { return []; }
}
function saveOrderHistory(arr){ localStorage.setItem('orderHistory', JSON.stringify(arr)); }

function createOrderSnapshot(){
  const items = loadCart();
  if(!items.length) return null;
  const subtotal = items.reduce((a,i)=>a+i.price*i.qty,0);
  const tax = items.length ? 8.00 : 0.00; // same rule as recalcCart
  const total = subtotal + tax;
  const mode = localStorage.getItem('orderMode') || 'delivery';
  // Per-order randomized thresholds for more organic ETAs
  // Base thresholds from current ORDER_STATUS_THRESHOLDS then add small variance +/-10%
  const baseReady = ORDER_STATUS_THRESHOLDS.ready;
  const baseCompleted = ORDER_STATUS_THRESHOLDS.completed;
  function jitter(ms){ return ms * (0.9 + Math.random()*0.2); }
  const readyAt = Date.now() + jitter(baseReady);
  const completedAt = readyAt + jitter(baseCompleted - baseReady);
  return {
    id: 'ORD-' + Date.now().toString(36).toUpperCase(),
    created: Date.now(),
    mode,
    items: items.map(i=>({...i})),
    subtotal, tax, total,
    status: 'preparing', // initial simulated status
    readyAt,
    completedAt
  };
}

// Status simulation thresholds (ms) (mutable via demo mode toggle)
let ORDER_STATUS_THRESHOLDS = {
  ready: 5 * 60 * 1000,      // >5 minutes => ready
  completed: 10 * 60 * 1000  // >10 minutes => completed
};
const LS_DEMO_MODE = 'orderDemoMode'; // 'fast' | ''
function applyDemoModeThresholds(){
  const mode = localStorage.getItem(LS_DEMO_MODE);
  if(mode === 'fast'){
    ORDER_STATUS_THRESHOLDS = { ready: 10 * 1000, completed: 20 * 1000 }; // 10s / 20s
  } else {
    ORDER_STATUS_THRESHOLDS = { ready: 5 * 60 * 1000, completed: 10 * 60 * 1000 };
  }
}
applyDemoModeThresholds();

// ---------------- Notifications (Order Status) ----------------
const LS_NOTIF_ENABLED = 'notifEnabled';
function notificationsAllowed(){ return localStorage.getItem(LS_NOTIF_ENABLED) === '1'; }
async function requestNotificationPermission(){
  if(!('Notification' in window)) return 'unsupported';
  if(Notification.permission === 'granted') return 'granted';
  const res = await Notification.requestPermission();
  return res;
}
function maybeNotify(title, body){
  if(!notificationsAllowed()) return;
  if(!('Notification' in window)) return;
  if(Notification.permission !== 'granted') return;
  try { new Notification(title, { body, tag: title }); } catch {}
}

function computeStatusFromAge(age){
  // age relative to dynamic per-order times handled in progressOrderStatuses (we keep this for legacy fallback)
  if(age >= ORDER_STATUS_THRESHOLDS.completed) return 'completed';
  if(age >= ORDER_STATUS_THRESHOLDS.ready) return 'ready';
  return 'preparing';
}

function progressOrderStatuses(){
  const history = loadOrderHistory();
  const transitions = []; // {id, from, to}
  let mutated = false;
  const now = Date.now();
  history.forEach(o=>{
    if(o.status === 'cancelled') return; // never progress cancelled
    // Use per-order dynamic thresholds if present
    let newStatus = o.status;
    if(o.readyAt && o.completedAt){
      if(now >= o.completedAt) newStatus = 'completed';
      else if(now >= o.readyAt) newStatus = 'ready';
      else newStatus = 'preparing';
    } else {
      const age = now - o.created;
      newStatus = computeStatusFromAge(age);
    }
    if(!o.status){
      o.status = newStatus;
      mutated = true;
      // treat as no toast for initial backfill
    } else if(o.status !== newStatus){
      const order = ['preparing','ready','completed'];
      if(order.indexOf(newStatus) > order.indexOf(o.status)){
        transitions.push({id:o.id, from:o.status, to:newStatus});
        o.status = newStatus;
        mutated = true;
      }
    }
  });
  if(mutated) saveOrderHistory(history);
  // Fire notifications for transitions
  transitions.forEach(tr => {
    if(tr.to === 'ready') maybeNotify('Order Ready', `Order ${tr.id} is ready.`);
    else if(tr.to === 'completed') maybeNotify('Order Completed', `Order ${tr.id} completed.`);
    // Toast fallback if notifications not shown
    if(typeof pushToast === 'function'){
      const notifAllowed = notificationsAllowed() && ('Notification' in window) && Notification.permission === 'granted';
      if(!notifAllowed){
        if(tr.to === 'ready') pushToast('Order #' + tr.id + ' is Ready', {tone:'info'});
        if(tr.to === 'completed') pushToast('Order #' + tr.id + ' Completed', {tone:'success'});
      }
    }
    announceOrderTransition(tr);
  });
  return transitions;
}

// --------------- Accessibility Live Region (Order Announcements) ---------------
let orderAnnounceEl = null;
function ensureOrderAnnounceRegion(){
  if(orderAnnounceEl) return orderAnnounceEl;
  orderAnnounceEl = document.createElement('div');
  orderAnnounceEl.setAttribute('aria-live','polite');
  orderAnnounceEl.setAttribute('aria-atomic','true');
  orderAnnounceEl.className='sr-only';
  document.body.appendChild(orderAnnounceEl);
  return orderAnnounceEl;
}
function announceOrderTransition(tr){
  try {
    const el = ensureOrderAnnounceRegion();
    const statusLabel = formatStatusLabel(tr.to);
    el.textContent = `Order ${tr.id} ${statusLabel}`;
  } catch {}
}

// Run progression early
progressOrderStatuses();

// Periodic tick to advance order statuses and refresh UI
const ORDER_TICK_MS = 30 * 1000; // 30s demo tick
setInterval(()=>{
  const transitions = progressOrderStatuses();
  if(transitions.length){
    renderLastOrder();
    renderOrdersPage();
    renderOrderStats();
  } else {
    // Even without transitions, refresh progress bars & ETA for smoother countdown UX
    updateLastOrderProgress();
    document.querySelectorAll('[data-orders-list] article').forEach(card=>{
      const idEl = card.querySelector('.font-semibold.text-sm');
      let id = null;
      if(idEl){
        const text = idEl.textContent.trim();
        if(text.startsWith('#')) id = text.slice(1);
      }
      if(!id) return;
      const order = loadOrderHistory().find(o=>o.id===id);
      if(order) updateOrderCardProgress(card, order);
    });
  }
  // Snapshot metrics history after each tick
  snapshotOrderMetrics();
}, ORDER_TICK_MS);

function renderLastOrder(){
  const section = document.querySelector('[data-last-order-section]');
  if(!section) return; // not on home
  const history = loadOrderHistory();
  const last = history[history.length-1];
  const empty = section.querySelector('[data-last-order-empty]');
  const card = section.querySelector('[data-last-order-card]');
  if(!last){
    empty?.classList.remove('hidden');
    card?.classList.add('hidden');
    return;
  }
  empty?.classList.add('hidden');
  card?.classList.remove('hidden');
  section.querySelector('[data-order-id]').textContent = '#' + last.id;
  section.querySelector('[data-order-total]').textContent = fmtRM(last.total);
  const ul = section.querySelector('[data-order-lines]');
  ul.innerHTML = '';
  last.items.forEach(it=>{
    const li = document.createElement('li');
    li.textContent = `${it.qty}× ${it.name} · ${fmtRM(it.price*it.qty)}`;
    ul.appendChild(li);
  });
  const timeEl = section.querySelector('[data-order-time]');
  const dt = new Date(last.created);
  timeEl.textContent = dt.toLocaleString();
  const statusBadge = section.querySelector('[data-order-status]');
  if(statusBadge){
    statusBadge.classList.remove('hidden');
    statusBadge.textContent = formatStatusLabel(last.status);
    statusBadge.className = 'inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ' + statusBadgeColor(last.status);
  }
  // Progress fill update
  updateLastOrderProgress();
  // Toggle cancel button visibility if present
  const cancelBtn = section.querySelector('[data-order-cancel]');
  if(cancelBtn){
    cancelBtn.classList.toggle('hidden', last.status !== 'preparing');
    cancelBtn.dataset.orderId = last.id;
  }
}

// Intercept checkout click to save snapshot then clear cart (simulate order placed) / queue if offline
document.addEventListener('click',(e)=>{
  const checkout = e.target.closest('[data-checkout]');
  if(!checkout) return;
  // Offline path: queue order (snapshot of cart) and clear cart for UX continuity
  if(!navigator.onLine && window.__offlineQueue){
    const items = JSON.parse(localStorage.getItem('cartItems')||'[]');
    if(items.length){
      const snapshot = { id:'queued-'+Date.now(), created:Date.now(), mode:(localStorage.getItem('mode')||'delivery'), items: JSON.parse(JSON.stringify(items)) };
      window.__offlineQueue.enqueue({ type:'placeOrder', snapshot });
      if(typeof pushToast==='function') pushToast('Order queued (offline)', { tone:'info' });
      updateCartStorage(arr=>{ arr.splice(0,arr.length); });
    }
    e.preventDefault();
    return;
  }
  // Online normal path
  const order = createOrderSnapshot();
  if(order){
    const history = loadOrderHistory();
    history.push(order);
    saveOrderHistory(history);
    const earned = Math.floor(order.subtotal * LOYALTY_EARN_RATE);
    if(earned>0){ addLoyaltyPoints(earned); }
    const redeemed = loadRedeemedPoints();
    if(redeemed>0){
      const current = loadLoyaltyPoints();
      saveLoyaltyPoints(Math.max(0, current - redeemed));
      clearRedeemedPoints();
    }
    updateCartStorage(items=>{ items.splice(0, items.length); });
  }
});

// Re-order: merge last order lines into current cart (adds quantities)
document.addEventListener('click',(e)=>{
  const reorderBtn = e.target.closest('[data-last-order-reorder]');
  if(reorderBtn){
    const history = loadOrderHistory();
    const last = history[history.length-1];
    if(!last) return;
    updateCartStorage(items=>{
      last.items.forEach(li=>{
        const existing = findCartItem(items, li.id);
        if(existing) existing.qty += li.qty; else items.push({...li});
      });
    });
    // Provide a lightweight visual cue (flash badge)
    const badge = document.querySelector('[data-cart-badge]');
    if(badge){
      badge.classList.remove('animate-pulse');
      void badge.offsetWidth; // reflow to restart animation
      badge.classList.add('animate-pulse');
      setTimeout(()=>badge.classList.remove('animate-pulse'), 1200);
    }
  }
});

// Intercept add-to-cart buttons globally to queue if offline (buttons carry data-add-cart attributes in some pages)
document.addEventListener('click',(e)=>{
  const addBtn = e.target.closest('[data-add-cart]');
  if(!addBtn) return;
  if(navigator.onLine || !window.__offlineQueue) return; // normal flow handles online
  const id = addBtn.getAttribute('data-id');
  const name = addBtn.getAttribute('data-name');
  const price = Number(addBtn.getAttribute('data-price'))||0;
  window.__offlineQueue.enqueue({ type:'addCartItem', item:{ id, name, price, qty:1 } });
  if(typeof pushToast==='function') pushToast('Added to queue (offline)', { tone:'info' });
  e.preventDefault();
});

// Queue replay handlers: apply queued actions when replay triggers custom events
document.addEventListener('queue:addCartItem',(e)=>{
  const item = e.detail; if(!item) return;
  updateCartStorage(items=>{
    const existing = items.find(l=>l.id===item.id);
    if(existing) existing.qty += item.qty||1; else items.push({ id:item.id, name:item.name, price:item.price, qty:item.qty||1 });
  });
});
document.addEventListener('queue:placeOrder',(e)=>{
  const snapshot = e.detail; if(!snapshot||!snapshot.items||!snapshot.items.length) return;
  const history = loadOrderHistory();
  const subtotal = snapshot.items.reduce((s,l)=> s + l.price*l.qty, 0);
  const tax = subtotal>0?8:0; const total = subtotal + tax;
  history.push({ ...snapshot, subtotal, tax, total, status:'preparing' });
  saveOrderHistory(history);
  if(typeof pushToast==='function') pushToast('Queued order synced', { tone:'success' });
  if($('#lastOrderCard')) renderLastOrderWidget();
  if($('[data-orders-list]')) renderOrdersPage();
});

// Render last order after DOM ready (home page only)
document.addEventListener('DOMContentLoaded', ()=>{
  renderLastOrder();
  // Service worker registration (if supported)
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('SW registration failed', err));
    // Listen for controllerchange to auto-reload after skipWaiting activation
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Avoid multiple reload loops
      if(window.__reloadedForSW) return; window.__reloadedForSW = true; location.reload();
    });

    // In-app update banner
    (function(){
      let waitingReg = null;
      const bannerId = 'app-update-banner';
      function ensureBanner(){
        if(document.getElementById(bannerId)) return document.getElementById(bannerId);
        const bar = document.createElement('div');
        bar.id = bannerId;
        bar.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-1.5rem)] bg-amber-600 text-white text-sm rounded-xl shadow-lg flex items-center justify-between gap-3 px-4 py-3 animate-[fadeIn_.25s_ease-out]';
        bar.innerHTML = `<span class="font-semibold">Update available</span><div class="flex gap-2"><button data-update-refresh class="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 font-semibold">Reload</button><button data-update-dismiss class="px-2 py-1.5 rounded-lg hover:bg-amber-500" aria-label="Dismiss">✕</button></div>`;
        document.body.appendChild(bar);
        bar.querySelector('[data-update-refresh]').addEventListener('click', ()=>{
          if(waitingReg){ waitingReg.active?.postMessage({type:'PING'}); waitingReg.waiting?.postMessage({ type:'SKIP_WAITING' }); }
          else if(navigator.serviceWorker.controller){ navigator.serviceWorker.controller.postMessage({ type:'SKIP_WAITING' }); }
        });
        bar.querySelector('[data-update-dismiss]').addEventListener('click', ()=> bar.remove());
        return bar;
      }
      navigator.serviceWorker.getRegistration().then(reg => {
        if(!reg) return;
        // Track waiting service worker
        if(reg.waiting){ waitingReg = reg; ensureBanner(); }
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if(sw){
            sw.addEventListener('statechange', () => {
              if(sw.state === 'installed' && reg.waiting){ waitingReg = reg; ensureBanner(); }
            });
          }
        });
      });
      // Message from SW when activated
      navigator.serviceWorker.addEventListener('message', (e)=>{
        if(e.data && e.data.type === 'SW_ACTIVATED'){
          // Optionally toast
          if(typeof pushToast==='function') pushToast('Updated to '+e.data.version, { tone:'success' });
        }
      });
    })();

    // Offline queue badge in bottom nav (account icon)
    (function(){
      function ensureBadge(anchor){
        if(!anchor) return null;
        let b = anchor.querySelector('.queue-indicator');
        if(!b){
          b = document.createElement('span');
          b.className = 'queue-indicator absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-800 hidden';
          anchor.classList.add('relative');
          anchor.appendChild(b);
        }
        return b;
      }
      function update(len){
        const anchor = document.querySelector('a[data-tab="account"]');
        const b = ensureBadge(anchor);
        if(!b) return;
        b.classList.toggle('hidden', !len);
      }
      window.addEventListener('offlinequeuechange', e => update(e.detail.length));
      if(window.__offlineQueue){ update(window.__offlineQueue.length()); }
    })();

    // Dynamic aria-current on bottom nav
    (function(){
      const path = location.pathname.split('/').pop() || 'index.html';
      const map = {
        'index.html':'home',
        'menu.html':'menu',
        'cart.html':'cart',
        'orders.html':'orders',
        'rewards.html':'rewards',
        'gift.html':'gift',
        'account.html':'account'
      };
      const tab = map[path];
      if(!tab) return;
      document.querySelectorAll('a[aria-current="page"]').forEach(a=>a.removeAttribute('aria-current'));
      const active = document.querySelector(`a[data-tab="${tab}"]`);
      if(active) active.setAttribute('aria-current','page');
    })();

    // Route prefetch on nav hover / touch for faster perceived navigation
    (function(){
      if(!('fetch' in window)) return;
      const PREFETCH_ATTR = 'data-prefetched';
      const links = document.querySelectorAll('nav a[href$=".html"]');
      function prefetch(href){
        if(!href || href.includes('#')) return;
        try {
          const u = new URL(href, location.href);
          const key = 'pf:'+u.pathname;
          if(sessionStorage.getItem(key)) return; // already fetched
          fetch(u.toString(), { credentials:'same-origin', mode:'no-cors' })
            .catch(()=>{})
            .finally(()=> sessionStorage.setItem(key,'1'));
        } catch(e){/* ignore */}
      }
      links.forEach(a=>{
        a.addEventListener('pointerenter', ()=>prefetch(a.getAttribute('href')),{ passive:true });
        a.addEventListener('touchstart', ()=>prefetch(a.getAttribute('href')),{ passive:true });
        a.addEventListener('focus', ()=>prefetch(a.getAttribute('href')),{ passive:true });
      });
    })();

    // ---------------- PWA Install Prompt Handling ----------------
    (function(){
      let deferredPrompt = null;
      const LS_INSTALL_DISMISSED = 'pwaInstallDismissed';
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if(isStandalone) return; // already installed
      if(isIos) return; // iOS has no beforeinstallprompt event (show native instructions separately if desired)
      if(localStorage.getItem(LS_INSTALL_DISMISSED)) return; // user dismissed earlier

      function createInstallButton(){
        // Prefer placing in Account page actions area if present; else attach fixed fab
        let container = document.querySelector('[data-account-actions]');
        if(!container){
          container = document.createElement('div');
          container.style.position='fixed';
          container.style.bottom='84px';
          container.style.right='16px';
          container.style.zIndex='60';
          document.body.appendChild(container);
        }
        const btn = document.createElement('button');
        btn.type='button';
        btn.textContent='Install App';
        btn.setAttribute('aria-label','Install App');
        btn.className='px-4 py-2 rounded-full shadow-lg bg-primary text-white text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500';
        btn.addEventListener('click', async () => {
          if(!deferredPrompt){ localStorage.setItem(LS_INSTALL_DISMISSED,'1'); btn.remove(); return; }
          btn.disabled = true;
          deferredPrompt.prompt();
          try {
            const { outcome } = await deferredPrompt.userChoice;
            if(outcome !== 'accepted'){
              // persist dismissal so we do not nag
              localStorage.setItem(LS_INSTALL_DISMISSED,'1');
            }
          } catch(e){ /* ignore */ }
          btn.remove();
          deferredPrompt = null;
        });
        return btn;
      }

      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent auto-mini infobar on some browsers
        e.preventDefault();
        deferredPrompt = e;
        // Only show button after short delay (allow page settle)
        setTimeout(()=>{
          if(!document.querySelector('[data-install-btn]')){
            const btn = createInstallButton();
            btn.dataset.installBtn='';
            // If we found account actions region, it's appended there already; else body fixed container
            (btn.parentElement || document.body).appendChild(btn);
          }
        }, 800);
      });

      window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        // Cleanup any remaining install button
        const b = document.querySelector('[data-install-btn]');
        if(b) b.remove();
        localStorage.removeItem(LS_INSTALL_DISMISSED);
        // Optional toast if toast system exists
        if(typeof pushToast === 'function') pushToast('App installed');
      });
    })();
  }
});

// ---------------- Orders Page Rendering ----------------
function renderOrdersPage(){
  const list = document.querySelector('[data-orders-list]');
  if(!list) return; // not on orders page
  const empty = document.querySelector('[data-orders-empty]');
  const statsSection = document.querySelector('[data-orders-stats]');
  const trendsSection = document.querySelector('[data-orders-trends]');
  const history = loadOrderHistory();
  if(!history.length){
    empty?.classList.remove('hidden');
    if(statsSection) statsSection.classList.add('hidden');
    if(trendsSection) trendsSection.classList.add('hidden');
    return;
  }
  empty?.classList.add('hidden');
  if(statsSection){
    statsSection.classList.remove('hidden');
    renderOrderStats();
  }
  if(trendsSection){
    trendsSection.classList.remove('hidden');
    renderOrderTrends();
  }
  list.innerHTML = '';
  history.slice().reverse().forEach(order=>{
    const card = document.createElement('article');
    card.className = 'bg-white dark:bg-slate-800/60 dark:border dark:border-slate-700 rounded-xl p-4 shadow-soft grid gap-2';
    card.innerHTML = `
      <div class="flex justify-between items-start gap-3">
        <div class="grid gap-1">
          <div class="font-semibold text-sm">#${order.id}</div>
          <div class="text-[11px] text-muted">${new Date(order.created).toLocaleString()}</div>
        </div>
        <div class="text-right font-bold min-w-[90px]">${fmtRM(order.total)}
          <div class="mt-1 flex flex-col items-end gap-1">
            <span class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadgeColor(order.status)}">${formatStatusLabel(order.status)}</span>
            <button data-order-cancel data-order-id="${order.id}" class="${order.status==='preparing' ? '' : 'hidden'} text-[9px] px-2 py-0.5 rounded-md bg-red-500/15 text-red-600 dark:text-red-300 border border-red-400/40 hover:bg-red-500/25 transition">${t('orders.cancel')}</button>
          </div>
        </div>
      </div>
      <div class="mt-1 mb-1">
        <div data-order-progress-track class="h-1.5 rounded-full bg-slate-200 dark:bg-slate-600 relative overflow-hidden">
          <div data-order-progress class="absolute inset-y-0 left-0 w-0 bg-gradient-to-r from-sky-500 via-amber-500 to-emerald-500 dark:from-sky-400 dark:via-amber-400 dark:to-emerald-400 rounded-full transition-all duration-500"></div>
          <div data-order-progress-cancel class="hidden absolute inset-0 bg-red-500/50 dark:bg-red-600/60 backdrop-blur-[1px]"></div>
        </div>
        <div class="flex justify-between mt-1 text-[10px] text-muted">
          <span data-i18n="status.preparing">${t('status.preparing')}</span>
          <span data-i18n="status.ready">${t('status.ready')}</span>
          <span data-i18n="status.completed">${t('status.completed')}</span>
        </div>
      </div>
      <button class="text-[11px] font-semibold text-primary hover:underline justify-self-start" data-expand-lines>${t('orders.toggle.show')}</button>
      <ul class="hidden text-[12px] leading-relaxed pl-4 list-disc" data-order-lines-list></ul>
    `;
    const ul = card.querySelector('[data-order-lines-list]');
    order.items.forEach(it=>{
      const li = document.createElement('li');
      li.textContent = `${it.qty}× ${it.name} · ${fmtRM(it.price*it.qty)}`;
      ul.appendChild(li);
    });
    list.appendChild(card);
    // Apply progress fill
    updateOrderCardProgress(card, order);
  });
  // Re-apply translations to newly injected dynamic buttons
  applyTranslations(currentLang);
}

function formatStatusLabel(status){
  const map = TRANSLATIONS[currentLang]?.status || TRANSLATIONS.en.status;
  return map[status] || status;
}

function statusBadgeColor(status){
  switch(status){
    case 'ready': return 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-400/40';
    case 'completed': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-400/40';
    case 'cancelled': return 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-400/40 line-through';
    default: return 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-400/40';
  }
}

// -------- Progress (Timeline) Helpers --------
// Returns 0..100 based on thresholds. Cancelled returns 100 but flagged separately.
function computeOrderProgress(order){
  if(!order || !order.created) return 0;
  if(order.status === 'cancelled') return 100; // treat as full bar but will overlay cancel style
  const now = Date.now();
  const readyAt = order.readyAt || (order.created + ORDER_STATUS_THRESHOLDS.ready);
  const completedAt = order.completedAt || (order.created + ORDER_STATUS_THRESHOLDS.completed);
  if(now >= completedAt) return 100;
  if(now <= order.created) return 0;
  if(now <= readyAt){
    const span = readyAt - order.created;
    const elapsed = now - order.created;
    return Math.min(50, (elapsed/span)*50);
  }
  const span2 = completedAt - readyAt;
  const elapsed2 = now - readyAt;
  return 50 + Math.min(50, (elapsed2/span2)*50);
}

// Returns an ETA object for display or null. Label kept short for UI.
function computeOrderETA(order){
  if(!order) return null;
  const now = Date.now();
  const age = now - (order.created||0);
  const readyAt = order.readyAt || (order.created + ORDER_STATUS_THRESHOLDS.ready);
  const completedAt = order.completedAt || (order.created + ORDER_STATUS_THRESHOLDS.completed);
  // Completed or cancelled -> no ETA
  if(order.status === 'completed' || now >= completedAt) return { remainingMs:0, label: t('status.completed') };
  if(order.status === 'cancelled') return { remainingMs:0, label: t('status.cancelled') };
  if(age < 0) return null;
  if(now < readyAt){
    const remaining = Math.max(0, readyAt - now);
    return { remainingMs: remaining, phase:'preparing', label: t('eta.prefix')+' '+formatEtaShort(remaining) };
  }
  // ready phase progressing to completed
  const remaining = Math.max(0, completedAt - now);
  return { remainingMs: remaining, phase:'ready', label: t('eta.prefix')+' '+formatEtaShort(remaining) };
}

function formatEtaShort(ms){
  const repl = (tpl, map)=> tpl.replace(/{{(\w+)}}/g, (_,k)=> map[k] ?? '');
  if(ms <= 0) return t('time.zero');
  const mins = Math.ceil(ms/60000);
  if(mins < 1) return t('time.lt1m');
  if(mins === 1) return t('time.about1m');
  if(mins < 60) return repl(t('time.minutes'), { m: mins });
  const hrs = Math.floor(mins/60);
  const rem = mins % 60;
  if(hrs === 1) return repl(t('time.hourRem'), { m: rem? rem+'m':'' });
  return repl(t('time.hoursRem'), { h: hrs, m: rem? rem+'m':'' });
}

function updateOrderCardProgress(card, order){
  if(!card) return;
  const bar = card.querySelector('[data-order-progress]');
  const cancelOverlay = card.querySelector('[data-order-progress-cancel]');
  if(!bar) return;
  const pct = computeOrderProgress(order);
  bar.style.width = pct + '%';
  if(order.status === 'cancelled'){
    cancelOverlay?.classList.remove('hidden');
    bar.classList.add('opacity-30');
  } else {
    cancelOverlay?.classList.add('hidden');
    bar.classList.remove('opacity-30');
  }
  const etaEl = card.querySelector('[data-order-eta]');
  if(etaEl){
    const eta = computeOrderETA(order);
    if(!eta || eta.remainingMs===0){
      // hide if completed/cancelled
      etaEl.textContent = eta && (order.status==='completed' || order.status==='cancelled') ? eta.label + ' (100%)' : '';
      etaEl.classList.toggle('hidden', !(eta && (order.status==='completed' || order.status==='cancelled')));
    } else {
      etaEl.textContent = eta.label + ' ('+Math.round(pct)+'%)';
      etaEl.classList.remove('hidden');
    }
  }
}

function updateLastOrderProgress(){
  const section = document.querySelector('[data-last-order-section]');
  if(!section) return;
  const history = loadOrderHistory();
  const last = history[history.length-1];
  if(!last) return;
  const bar = section.querySelector('[data-order-progress]');
  const cancelOverlay = section.querySelector('[data-order-progress-cancel]');
  if(!bar) return;
  const pct = computeOrderProgress(last);
  bar.style.width = pct + '%';
  if(last.status === 'cancelled'){
    cancelOverlay?.classList.remove('hidden');
    bar.classList.add('opacity-30');
  } else {
    cancelOverlay?.classList.add('hidden');
    bar.classList.remove('opacity-30');
  }
  const etaEl = section.querySelector('[data-order-eta]');
  if(etaEl){
    const eta = computeOrderETA(last);
    if(!eta || eta.remainingMs===0){
      etaEl.textContent = eta && (last.status==='completed' || last.status==='cancelled') ? eta.label + ' (100%)' : '';
      etaEl.classList.toggle('hidden', !(eta && (last.status==='completed' || last.status==='cancelled')));
    } else {
      etaEl.textContent = eta.label + ' ('+Math.round(pct)+'%)';
      etaEl.classList.remove('hidden');
    }
  }
}

// Cancel order handler (home + orders page)
document.addEventListener('click',(e)=>{
  const btn = e.target.closest('[data-order-cancel]');
  if(!btn) return;
  const id = btn.dataset.orderId;
  if(!id) return;
  const history = loadOrderHistory();
  const target = history.find(o=>o.id === id);
  if(target && target.status === 'preparing'){
    target.status = 'cancelled';
    saveOrderHistory(history);
    pushToast('Order #' + target.id + ' cancelled', {tone:'error'});
    renderLastOrder();
    renderOrdersPage();
  }
});

// Periodic status refresh (1 min)
// (Removed: merged into 30s ORDER_TICK_MS loop for unified scheduling)

document.addEventListener('DOMContentLoaded', ()=>{
  renderOrdersPage();
  // Inject demo mode toggle into account page preferences if region exists
  const prefRegion = document.querySelector('[data-preferences-panel]');
  if(prefRegion && !prefRegion.querySelector('[data-demo-mode-toggle]')){
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between py-2 border-t border-slate-200 dark:border-slate-700';
    const lbl = document.createElement('span');
    lbl.className = 'text-sm';
    lbl.textContent = 'Fast Demo Mode';
    const btn = document.createElement('button');
    btn.type='button';
    btn.setAttribute('role','switch');
    btn.setAttribute('aria-checked', localStorage.getItem(LS_DEMO_MODE)==='fast' ? 'true':'false');
    btn.dataset.demoModeToggle='';
    btn.className='w-10 h-6 rounded-full relative transition bg-slate-300 dark:bg-slate-600 aria-[checked=true]:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500';
    btn.innerHTML='<span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition aria-[checked=true]:translate-x-4"></span>';
    row.appendChild(lbl); row.appendChild(btn); prefRegion.appendChild(row);

    // Export / Import buttons row
    const row2 = document.createElement('div');
    row2.className = 'flex items-center gap-3 pt-3';
    row2.innerHTML = `
      <button type="button" data-export-settings class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-600 text-[11px] font-semibold">Export Settings</button>
      <button type="button" data-import-settings class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-600 text-[11px] font-semibold">Import Settings</button>
      <input type="file" accept="application/json" class="hidden" data-import-file />
    `;
    prefRegion.appendChild(row2);
  }
  // Auto-open deep link product param
  try {
    const u = new URL(location.href);
    const pid = u.searchParams.get('product');
    if(pid){ setTimeout(()=> openProductModal(pid), 300); }
  } catch {}
});

// Handle back/forward for product modal
window.addEventListener('popstate', ()=>{
  try {
    const u = new URL(location.href);
    const pid = u.searchParams.get('product');
    const modalVisible = document.querySelector('[data-product-modal]') && !document.querySelector('[data-product-modal]').classList.contains('hidden');
    if(pid && !modalVisible) openProductModal(pid);
    if(!pid && modalVisible) closeProductModal();
  } catch {}
});

// Expand/collapse lines in orders list
document.addEventListener('click',(e)=>{
  const toggle = e.target.closest('[data-expand-lines]');
  if(toggle){
    const ul = toggle.parentElement?.parentElement?.querySelector('[data-order-lines-list]');
    if(!ul) return;
    const hidden = ul.classList.toggle('hidden');
    toggle.textContent = hidden ? t('orders.toggle.show') : t('orders.toggle.hide');
  }
  const demoBtn = e.target.closest('[data-demo-mode-toggle]');
  if(demoBtn){
    const active = localStorage.getItem(LS_DEMO_MODE)==='fast';
    if(active){ localStorage.removeItem(LS_DEMO_MODE); }
    else { localStorage.setItem(LS_DEMO_MODE,'fast'); }
    applyDemoModeThresholds();
    // Force immediate status recompute & UI refresh
    const trans = progressOrderStatuses();
    renderLastOrder();
    renderOrdersPage();
    if(trans.length) renderOrderStats(); else updateLastOrderProgress();
    demoBtn.setAttribute('aria-checked', active ? 'false':'true');
    if(typeof pushToast==='function') pushToast(active? 'Demo mode off':'Demo mode on (10s/20s)', {tone:'info'});
  }
  const exportBtn = e.target.closest('[data-export-settings]');
  if(exportBtn){
    const KEYS = [
      'cartItems','orderHistory','orderDemoMode','loyaltyPoints','loyaltyRedeem','favorites','promoCode','loyaltyPoints','giftVouchers','favoritesFilter','activeCategory','searchQuery','theme','lang','offlineActionQueue','pwaInstallDismissed','analyticsEvents','analyticsEnabled','notifEnabled'
    ];
    const data = {};
    KEYS.forEach(k=>{ const v = localStorage.getItem(k); if(v!=null) data[k]=v; });
    data.__exportVersion = 1;
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'app-settings-export.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
    if(typeof pushToast==='function') pushToast(t('settings.exported'), {tone:'success'});
  }
  const importBtn = e.target.closest('[data-import-settings]');
  if(importBtn){
    const input = document.querySelector('[data-import-file]');
    if(input){ input.value=''; input.click(); }
  }
  const resetBtn = e.target.closest('[data-reset-settings]');
  if(resetBtn){
    const CONFIRM = confirm('Reset settings?');
    if(!CONFIRM) return;
    const PRESERVE = ['lang','theme'];
    Object.keys(localStorage).forEach(k=>{ if(!PRESERVE.includes(k)) localStorage.removeItem(k); });
    applyDemoModeThresholds();
    renderLastOrder();
    renderOrdersPage();
    renderOrderStats();
    applyTranslations(localStorage.getItem('lang')||currentLang);
    updateCartBadge();
    if(typeof pushToast==='function') pushToast(t('settings.reset'), {tone:'info'});
  }
});

// Handle settings import file change
document.addEventListener('change',(e)=>{
  const fileInput = e.target.closest('[data-import-file]');
  if(fileInput && fileInput.files && fileInput.files[0]){
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = (ev)=>{
      try {
        const json = JSON.parse(ev.target.result);
        if(json && json.__exportVersion && json.__exportVersion <= 1){
          Object.keys(json||{}).forEach(k=>{
            if(k === '__exportVersion') return;
            if(typeof json[k] === 'string'){ localStorage.setItem(k, json[k]); }
          });
          if(typeof pushToast==='function') pushToast(t('settings.imported'), {tone:'success'});
        } else {
          if(typeof pushToast==='function') pushToast(t('settings.importFailed'), {tone:'error'});
          return;
        }
        // Reapply key-dependent UIs
        applyDemoModeThresholds();
        renderLastOrder();
        renderOrdersPage();
        renderOrderStats();
        applyTranslations(localStorage.getItem('lang')||currentLang);
        updateCartBadge();
      } catch(err){
        console.warn('Import failed', err);
        if(typeof pushToast==='function') pushToast(t('settings.importFailed'), {tone:'error'});
      }
    };
    reader.readAsText(file);
  }
});

// Clear order history
document.addEventListener('click',(e)=>{
  const clear = e.target.closest('[data-clear-history]');
  if(clear){
    localStorage.removeItem('orderHistory');
    renderOrdersPage();
    renderLastOrder();
  }
});

// Recompute stats manually (Refresh button)
document.addEventListener('click',(e)=>{
  const btn = e.target.closest('[data-refresh-stats]');
  if(btn){
    renderOrderStats();
    pushToast('Stats refreshed', {tone:'info', timeout:2000});
  }
  const toggleDetail = e.target.closest('[data-toggle-trends-detail]');
  if(toggleDetail){
    const detail = document.querySelector('[data-trends-detail]');
    if(detail){
      const isHidden = detail.classList.toggle('hidden');
      toggleDetail.textContent = isHidden ? t('trends.detail') : t('trends.hide');
      if(!isHidden){ updateTrendsDetail(detail); }
    }
  }
  const cacheBtn = e.target.closest('[data-cache-info]');
  if(cacheBtn){
    if(navigator.serviceWorker?.controller){
      navigator.serviceWorker.controller.postMessage({ type:'CACHE_INFO_REQUEST' });
      pushToast(t('cache.requesting'), {tone:'info', timeout:1500});
    } else {
      pushToast(t('cache.none'), {tone:'error'});
    }
  }
  const exportTrendsBtn = e.target.closest('[data-export-trends]');
  if(exportTrendsBtn){
    exportOrderTrendsCSV();
  }
});

// ---------- Analytics (Orders Page) ----------
function computeOrderStats(){
  const history = loadOrderHistory();
  if(!history.length) return null;
  let totalSpend = 0;
  let active = 0; // preparing + ready
  let completed = 0;
  let cancelled = 0;
  let totalPrepMs = 0; // created -> ready
  let totalReadyPhaseMs = 0; // ready -> completed
  let countedPrep = 0;
  let countedReady = 0;
  const itemFreq = new Map(); // id -> {name, qty, revenue}
  history.forEach(o=>{
    totalSpend += o.total || 0;
    if(o.status === 'preparing' || o.status === 'ready') active++;
    else if(o.status === 'completed') completed++;
    else if(o.status === 'cancelled') cancelled++;
    if(o.readyTs && o.created && o.readyTs >= o.created){ totalPrepMs += (o.readyTs - o.created); countedPrep++; }
    if(o.completedTs && o.readyTs && o.completedTs >= o.readyTs){ totalReadyPhaseMs += (o.completedTs - o.readyTs); countedReady++; }
    (o.items||[]).forEach(it=>{
      const entry = itemFreq.get(it.id) || {name: it.name, qty:0, revenue:0};
      entry.qty += it.qty;
      entry.revenue += it.price * it.qty;
      itemFreq.set(it.id, entry);
    });
  });
  const count = history.length;
  const aov = totalSpend / count;
  // Determine top item by qty then revenue fallback
  let top = null;
  itemFreq.forEach(v=>{
    if(!top) top = v; else if(v.qty > top.qty || (v.qty === top.qty && v.revenue > top.revenue)) top = v;
  });
  return {
    count,
    active,
    completed,
    cancelled,
    totalSpend,
    aov,
    avgPrepMs: countedPrep ? Math.round(totalPrepMs / countedPrep) : 0,
    avgReadyPhaseMs: countedReady ? Math.round(totalReadyPhaseMs / countedReady) : 0,
    topName: top ? top.name : null,
    topQty: top ? top.qty : 0,
    cancelRate: count ? (cancelled / count) : 0
  };
}

function renderOrderStats(){
  const stats = computeOrderStats();
  const section = document.querySelector('[data-orders-stats]');
  if(!section || !stats){
    if(section) section.classList.add('hidden');
    return;
  }
  section.querySelector('[data-stat-count]').textContent = stats.count;
  section.querySelector('[data-stat-active]').textContent = stats.active;
  section.querySelector('[data-stat-completed]').textContent = stats.completed;
  section.querySelector('[data-stat-cancelled]').textContent = stats.cancelled;
  section.querySelector('[data-stat-spend]').textContent = fmtRM(stats.totalSpend);
  section.querySelector('[data-stat-aov]').textContent = fmtRM(stats.aov || 0);
  section.querySelector('[data-stat-top-item]').textContent = stats.topName || '—';
  section.querySelector('[data-stat-top-qty]').textContent = stats.topQty;
  const prepEl = section.querySelector('[data-stat-avg-prep]');
  const readyEl = section.querySelector('[data-stat-avg-ready]');
  const cancelRateEl = section.querySelector('[data-stat-cancel-rate]');
  if(prepEl){
    prepEl.textContent = stats.avgPrepMs ? Math.round(stats.avgPrepMs/600)/100 + 'm' : '—';
  }
  if(readyEl){
    readyEl.textContent = stats.avgReadyPhaseMs ? Math.round(stats.avgReadyPhaseMs/600)/100 + 'm' : '—';
  }
  if(cancelRateEl){
    cancelRateEl.textContent = (stats.cancelRate*100).toFixed(0)+'%';
  }
}

// -------- Trends Panel Rendering --------
function renderOrderTrends(){
  const section = document.querySelector('[data-orders-trends]');
  if(!section) return;
  const history = loadOrderMetricsHistory();
  if(!history.length){ section.classList.add('hidden'); return; }
  // Update last value labels
  const last = history[history.length-1];
  section.querySelector('[data-trend-active-last]').textContent = last.active;
  section.querySelector('[data-trend-completed-last]').textContent = last.completed;
  if(section.querySelector('[data-trend-cancel-rate-last]')){
    section.querySelector('[data-trend-cancel-rate-last]').textContent = (last.cancelRate*100).toFixed(0)+'%';
  }
  // Draw sparklines
  drawSparkline(section.querySelector('[data-trend-active]'), history.map(h=>h.active));
  drawSparkline(section.querySelector('[data-trend-completed]'), history.map(h=>h.completed));
  const cancelCanvas = section.querySelector('[data-trend-cancel-rate]');
  if(cancelCanvas){
    drawSparkline(cancelCanvas, history.map(h=>Number((h.cancelRate*100).toFixed(2))));
  }
  const detail = section.querySelector('[data-trends-detail]');
  if(detail && !detail.classList.contains('hidden')){ updateTrendsDetail(detail); }
}

function updateTrendsDetail(el){
  const history = loadOrderMetricsHistory();
  if(!history.length){ el.textContent=''; return; }
  const firstTs = history[0].ts;
  const lines = history.slice(-10).map(h=>{
    const mins = ((h.ts - firstTs)/60000).toFixed(1);
    return `${mins}m: a=${h.active} c=${h.completed} cancel=${(h.cancelRate*100).toFixed(0)}% prep=${h.avgPrepMs||0}ms ready=${h.avgReadyPhaseMs||0}ms`;
  });
  el.textContent = lines.join('\n');
}

function drawSparkline(canvas, data){
  if(!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 280;
  const h = canvas.height = canvas.getAttribute('height')? Number(canvas.getAttribute('height')):40;
  ctx.clearRect(0,0,w,h);
  if(!data.length){ return; }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = (max-min)||1;
  const step = w / Math.max(1,(data.length-1));
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#0ea5e9';
  ctx.beginPath();
  data.forEach((v,i)=>{
    const x = i*step;
    const y = h - ((v-min)/range)*h;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();
  // Gradient fill for subtlety
  const grad = ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'rgba(14,165,233,0.35)');
  grad.addColorStop(1,'rgba(14,165,233,0)');
  ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
}

function exportOrderTrendsCSV(){
  const history = loadOrderMetricsHistory();
  if(!history.length){ pushToast('No data', {tone:'error'}); return; }
  const header = ['timestamp','active','completed','cancelled','totalOrders','avgPrepMs','avgReadyPhaseMs','cancelRate'];
  const rows = history.map(r=>[
    new Date(r.ts).toISOString(), r.active, r.completed, r.cancelled, r.totalOrders, r.avgPrepMs, r.avgReadyPhaseMs, r.cancelRate
  ]);
  const csv = [header.join(','), ...rows.map(r=>r.join(','))].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'order-trends.csv'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
  pushToast('CSV exported', {tone:'success'});
}

// -------- Order Metrics History (trend snapshots) --------
// Stores lightweight time series of selected metrics for mini trend charts.
// Shape: [{ ts, active, completed, cancelled, totalOrders, avgPrepMs, avgReadyPhaseMs }]
const ORDER_METRICS_HISTORY_KEY = 'orderMetricsHistory';
function loadOrderMetricsHistory(){
  try { return JSON.parse(localStorage.getItem(ORDER_METRICS_HISTORY_KEY)||'[]')||[]; } catch { return []; }
}
function saveOrderMetricsHistory(arr){
  localStorage.setItem(ORDER_METRICS_HISTORY_KEY, JSON.stringify(arr));
}
function snapshotOrderMetrics(){
  const stats = computeOrderStats();
  if(!stats) return; // no orders yet
  const list = loadOrderMetricsHistory();
  list.push({
    ts: Date.now(),
    active: stats.active,
    completed: stats.completed,
    cancelled: stats.cancelled,
    totalOrders: stats.count,
    avgPrepMs: stats.avgPrepMs,
    avgReadyPhaseMs: stats.avgReadyPhaseMs,
    cancelRate: stats.cancelRate
  });
  // Cap history (keeping most recent N)
  const CAP = 48; // roughly last 24 mins at 30s interval (tunable)
  if(list.length > CAP){ list.splice(0, list.length - CAP); }
  saveOrderMetricsHistory(list);
}
// Initial snapshot on load (after DOM ready & initial stats rendered)
document.addEventListener('DOMContentLoaded', ()=> setTimeout(snapshotOrderMetrics, 500));

// -------- Network Status Indicator --------
function ensureNetworkIndicator(){
  if(document.querySelector('[data-network-indicator]')) return;
  const bar = document.createElement('div');
  bar.dataset.networkIndicator='';
  bar.setAttribute('role','status');
  bar.setAttribute('aria-live','polite');
  bar.className='fixed top-0 left-1/2 -translate-x-1/2 z-[998] mt-2 px-3 py-1 rounded-full text-xs font-semibold shadow-soft backdrop-blur transition-colors bg-emerald-600/90 text-white dark:bg-emerald-500/90';
  bar.textContent = t('accessibility.network.online');
  document.body.appendChild(bar);
  updateNetworkIndicator();
}
// Track offline timing & last sync
const LS_OFFLINE_START = 'offlineStartTs';
const LS_OFFLINE_ACCUM = 'offlineAccumMs';
const LS_LAST_SYNC = 'lastSyncTs';
function getOfflineAccum(){ return Number(localStorage.getItem(LS_OFFLINE_ACCUM)||'0')||0; }
function setOfflineAccum(v){ localStorage.setItem(LS_OFFLINE_ACCUM, String(v)); }
function shortTime(ts){ if(!ts) return '—'; return new Date(ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}); }
window.addEventListener('offline', ()=>{ if(!localStorage.getItem(LS_OFFLINE_START)) localStorage.setItem(LS_OFFLINE_START, Date.now()); updateNetworkIndicator(); });
window.addEventListener('online', ()=>{ const s = Number(localStorage.getItem(LS_OFFLINE_START)||'0'); if(s){ setOfflineAccum(getOfflineAccum() + (Date.now()-s)); localStorage.removeItem(LS_OFFLINE_START);} updateNetworkIndicator(); ensurePerfPanelRefresh(); });
async function manualSyncOfflineQueue(){
  const btn = document.querySelector('[data-manual-sync]'); if(btn){ btn.disabled=true; btn.textContent = t('accessibility.network.syncing')||'Syncing...'; }
  try {
    if(typeof replay === 'function') await replay();
    localStorage.setItem(LS_LAST_SYNC, Date.now());
    pushToast((t('accessibility.network.lastSync')||'Last Sync')+': '+shortTime(Number(localStorage.getItem(LS_LAST_SYNC))), {tone:'success'});
  } catch(e){ pushToast('Sync failed', {tone:'error'}); }
  finally {
    if(btn){ btn.disabled=false; btn.textContent = t('accessibility.network.syncNow')||'Sync Now'; }
    updateNetworkIndicator(); ensurePerfPanelRefresh();
  }
}
function updateNetworkIndicator(){
  const el = document.querySelector('[data-network-indicator]'); if(!el) return;
  const online = navigator.onLine;
  let base = t(online ? 'accessibility.network.online' : 'accessibility.network.offline');
  if(!online && window.__offlineQueue){
    const len = window.__offlineQueue.length();
    if(len>0){
      // Using generic pattern: base + (Queued N)
      base += ` (${t('accessibility.network.queued')} ${len})`;
    }
  }
  el.textContent = base;
  el.classList.toggle('bg-emerald-600/90', online);
  el.classList.toggle('dark:bg-emerald-500/90', online);
  el.classList.toggle('bg-amber-600/90', !online);
  el.classList.toggle('dark:bg-amber-500/90', !online);
  const lastSync = Number(localStorage.getItem(LS_LAST_SYNC)||'0');
  el.title = (t('accessibility.network.lastSync')||'Last Sync')+': '+(lastSync?shortTime(lastSync):'—');
  let syncBtn = document.querySelector('[data-manual-sync]');
  if(!online){
    if(!syncBtn){
      syncBtn = document.createElement('button');
      syncBtn.type='button'; syncBtn.dataset.manualSync='';
      syncBtn.className='fixed top-10 left-1/2 -translate-x-1/2 z-[998] mt-2 px-3 py-1 rounded-full text-xs font-semibold shadow-soft backdrop-blur bg-indigo-600/90 text-white dark:bg-indigo-500/90';
      syncBtn.textContent = t('accessibility.network.syncNow')||'Sync Now';
      syncBtn.addEventListener('click', manualSyncOfflineQueue);
      document.body.appendChild(syncBtn);
    }
  } else if(syncBtn){ syncBtn.remove(); }
}
window.addEventListener('online', updateNetworkIndicator);
window.addEventListener('offline', updateNetworkIndicator);
document.addEventListener('DOMContentLoaded', ensureNetworkIndicator);

// -------- Performance Metrics Panel (Account Page) --------
const PERF_LS_KEY = 'perfMetrics';
// ---- Settings Model ----
const SETTINGS_KEY = 'appSettings';
const DEFAULT_SETTINGS = {
  latencyAlertThreshold: 800, // ms for p95
  latencyAlertCooldown: 60000, // ms
  latencyHistoryCap: 50
};
function loadSettings(){
  try { const obj = JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')||{}; return { ...DEFAULT_SETTINGS, ...obj }; } catch { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings(s){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
function loadPerf(){ try { return JSON.parse(localStorage.getItem(PERF_LS_KEY)||'{}'); } catch { return {}; } }
function savePerf(obj){ localStorage.setItem(PERF_LS_KEY, JSON.stringify(obj)); }
// Hook existing analytics/perf events to collect grid render timings already logged as perf_render_product_grid
window.addEventListener('analyticschange', ()=>{
  const evs = (window.__analytics?.list()||[]).filter(e=> e.type==='perf_render_product_grid');
  if(!evs.length) return;
  const perf = loadPerf();
  perf.grid = perf.grid || { total:0, count:0 };
  evs.forEach(e=>{
    if(!e.__counted){
      perf.grid.total += e.data.ms||0; perf.grid.count += 1; e.__counted=true;
    }
  });
  savePerf(perf);
});

document.addEventListener('DOMContentLoaded', ()=>{
  if(document.body.matches('[data-page-account]')){
    ensurePerfPanel();
    ensureContrastToggle();
    ensureQueueDebugButton();
  }
  ensureOutletTrigger();
});

function ensurePerfPanel(){
  if(document.querySelector('[data-perf-panel]')) return;
  const main = document.querySelector('main'); if(!main) return;
  const perf = loadPerf();
  const gridAvg = perf.grid && perf.grid.count ? Math.round(perf.grid.total / perf.grid.count) : 0;
  let offlineMs = getOfflineAccum();
  const start = Number(localStorage.getItem(LS_OFFLINE_START)||'0');
  if(start) offlineMs += (Date.now()-start);
  const offlineSec = Math.floor(offlineMs/1000);
  const lastSync = Number(localStorage.getItem(LS_LAST_SYNC)||'0');
  const panel = document.createElement('section');
  panel.dataset.perfPanel='';
  panel.className='mt-8 border rounded-lg p-4 bg-white dark:bg-gray-800';
  panel.innerHTML = `
    <div class="flex items-center justify-between mb-2"><h2 class="font-semibold text-sm" data-i18n="perf.title">Performance</h2><button data-perf-reset class="text-[11px] font-semibold text-primary hover:underline" data-i18n="perf.reset">Reset Perf</button></div>
    <ul class="text-[12px] space-y-1">
      <li><span data-i18n="perf.appReady">App Ready (ms)</span>: <strong data-perf-app-ready>${Math.round(performance.now())}</strong></li>
      <li><span data-i18n="perf.avgGrid">Avg Product Grid Render (ms)</span>: <strong data-perf-grid-avg>${gridAvg}</strong></li>
      <li><span data-i18n="perf.renders">Grid Renders</span>: <strong data-perf-grid-count>${perf.grid?.count||0}</strong></li>
  <li><span data-i18n="accessibility.network.queue">Queue</span>: <strong data-perf-queue>${window.__offlineQueue?window.__offlineQueue.length():0}</strong></li>
      <li><span data-i18n="perf.offlineTime">Offline Time (s)</span>: <strong data-perf-offline>${offlineSec}</strong></li>
      <li><span data-i18n="accessibility.network.lastSync">Last Sync</span>: <strong data-perf-last-sync>${shortTime(lastSync)}</strong></li>
      <li><span data-i18n="perf.syncLatency">Last Queue Sync (ms)</span>: <strong data-perf-sync-latency>-</strong></li>
      <li><span data-i18n="perf.syncAvg">Avg Sync (ms)</span>: <strong data-perf-sync-avg>-</strong></li>
      <li><span data-i18n="perf.syncP95">P95 Sync (ms)</span>: <strong data-perf-sync-p95>-</strong></li>
  <li><span data-i18n="perf.syncMedian">Median Sync (ms)</span>: <strong data-perf-sync-median>-</strong></li>
  <li><span data-i18n="perf.syncP90">P90 Sync (ms)</span>: <strong data-perf-sync-p90>-</strong></li>
  <li><span data-i18n="perf.syncMax">Max Sync (ms)</span>: <strong data-perf-sync-max>-</strong></li>
      <li><span data-i18n="perf.syncCount">Sync Samples</span>: <strong data-perf-sync-count>-</strong></li>
  <li><span data-i18n="perf.failures">Failed Actions</span>: <strong data-perf-failures>-</strong></li>
  <li class="flex items-center gap-2"><span data-i18n="perf.syncTrend">Sync Trend</span>: <svg data-perf-sync-spark width="80" height="20" viewBox="0 0 80 20" preserveAspectRatio="none" class="overflow-visible"><path d="" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/></svg></li>
      <li><span data-i18n="pwa.funnel.installRate">Install Rate</span>: <strong data-perf-install-rate>-</strong></li>
    </ul>`;
  panel.innerHTML += `
    <div class="mt-2 grid gap-2 sm:flex sm:gap-2">
      <button type="button" data-sync-export class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-[11px] font-medium flex-1" data-i18n="perf.syncExport">Export Syncs</button>
      <button type="button" data-sync-clear class="px-2 py-1 rounded bg-red-50 dark:bg-red-600/20 text-red-700 dark:text-red-300 text-[11px] font-medium flex-1" data-i18n="perf.syncClear">Clear Syncs</button>
      <button type="button" data-export-all class="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium flex-1" data-i18n="perf.exportAll">Export All Analytics</button>
    </div>`;
  main.appendChild(panel);
  applyTranslations(currentLang);
  panel.querySelector('[data-perf-reset]')?.addEventListener('click', ()=>{
    localStorage.removeItem(PERF_LS_KEY);
    ensurePerfPanelRefresh();
    pushToast('Perf reset', {tone:'info'});
  });
  panel.querySelector('[data-sync-export]')?.addEventListener('click', ()=>{
    try {
      const raw = localStorage.getItem('offlineLatencyHistory')||'[]';
      const blob = new Blob([raw], { type:'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='sync-latencies.json'; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 1500);
    } catch(e){ console.error(e); }
  });
  panel.querySelector('[data-sync-clear]')?.addEventListener('click', ()=>{
    if(!confirm('Clear sync latency history?')) return;
    localStorage.removeItem('offlineLatencyHistory');
    localStorage.removeItem('offlineLastLatency');
    window.dispatchEvent(new CustomEvent('offlinesynccomplete'));
  });
  panel.querySelector('[data-export-all]')?.addEventListener('click', ()=>{
    try {
      const pick = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)||fallback); } catch { return fallback?JSON.parse(fallback):null; } };
      const bundle = {
        generatedAt: new Date().toISOString(),
        latencyHistory: pick('offlineLatencyHistory','[]'),
        syncHistory: pick('offlineSyncHistory','[]'),
        analyticsEvents: pick('analytics:events:v1','[]'),
        perfMetrics: pick('perfMetrics','{}'),
        queue: pick('offlineActionQueue','[]'),
        failed: pick('offlineFailedActions','[]'),
        install: {
          installed: !!localStorage.getItem('pwaInstalledFlag'),
          dismissed: !!localStorage.getItem('pwaInstallDismissed')
        }
      };
      const blob = new Blob([JSON.stringify(bundle,null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='analytics-bundle.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),2000);
    } catch(e){ console.error(e); }
  });
}
// Settings Panel (Account Page)
function ensureSettingsPanel(){
  if(!document.body.matches('[data-page-account]')) return;
  if(document.querySelector('[data-settings-panel]')) return;
  const main = document.querySelector('main'); if(!main) return;
  const s = loadSettings();
  const sec = document.createElement('section');
  sec.dataset.settingsPanel='';
  sec.className='mt-8 border rounded-lg p-4 bg-white dark:bg-gray-800';
  sec.innerHTML = `
    <div class="flex items-center justify-between mb-2"><h2 class="font-semibold text-sm" data-i18n="settings.title">Settings</h2><button type="button" data-settings-save class="text-[11px] font-semibold text-primary hover:underline" data-i18n="settings.save">Save</button></div>
    <form class="space-y-3 text-[12px]" data-settings-form>
      <label class="flex flex-col gap-1">
        <span data-i18n="settings.latencyThreshold">Latency Alert Threshold (p95 ms)</span>
        <input type="number" min="100" step="50" name="latencyAlertThreshold" value="${s.latencyAlertThreshold}" class="px-2 py-1 rounded border bg-white dark:bg-slate-700" />
      </label>
      <label class="flex flex-col gap-1">
        <span data-i18n="settings.latencyCooldown">Latency Alert Cooldown (ms)</span>
        <input type="number" min="1000" step="500" name="latencyAlertCooldown" value="${s.latencyAlertCooldown}" class="px-2 py-1 rounded border bg-white dark:bg-slate-700" />
      </label>
      <label class="flex flex-col gap-1">
        <span data-i18n="settings.latencyCap">Latency History Cap</span>
        <input type="number" min="10" max="500" step="10" name="latencyHistoryCap" value="${s.latencyHistoryCap}" class="px-2 py-1 rounded border bg-white dark:bg-slate-700" />
      </label>
      <div class="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
        <button type="button" data-settings-reset class="text-[11px] font-semibold text-amber-600 hover:underline" data-i18n="settings.reset">Reset Defaults</button>
        <button type="button" data-theme-toggle class="ml-auto text-[11px] font-semibold hover:underline" data-i18n="theme.dark">Dark Mode</button>
      </div>
    </form>`;
  main.appendChild(sec);
  applyTranslations(currentLang);
  sec.querySelector('[data-settings-save]')?.addEventListener('click', ()=>{
    try {
      const form = sec.querySelector('[data-settings-form]');
      const fd = new FormData(form);
      const next = { ...loadSettings() };
      for(const k of ['latencyAlertThreshold','latencyAlertCooldown','latencyHistoryCap']){
        const v = Number(fd.get(k)); if(!isNaN(v) && v>0) next[k]=v;
      }
      saveSettings(next);
      pushToast('Settings saved', {tone:'success'});
    } catch(e){ pushToast('Save failed', {tone:'error'}); }
  });
  // Reset defaults
  sec.querySelector('[data-settings-reset]')?.addEventListener('click', ()=>{
    if(!confirm('Reset settings to defaults?')) return;
    saveSettings({ ...DEFAULT_SETTINGS });
    pushToast('Settings reset', {tone:'info'});
    ensureSettingsPanel();
  });
  // Dark mode toggle
  const THEME_KEY='appTheme';
  function applyTheme(){
    const mode = localStorage.getItem(THEME_KEY)||'light';
    document.documentElement.classList.toggle('dark', mode==='dark');
    const btn = sec.querySelector('[data-theme-toggle]');
    if(btn){ btn.textContent = mode==='dark'? t('theme.light') : t('theme.dark'); }
  }
  applyTheme();
  sec.querySelector('[data-theme-toggle]')?.addEventListener('click', ()=>{
    const mode = localStorage.getItem(THEME_KEY)==='dark' ? 'light':'dark';
    localStorage.setItem(THEME_KEY, mode);
    applyTheme();
  });
}
document.addEventListener('DOMContentLoaded', ensureSettingsPanel);

// Global outlet filter banner clear handler
document.addEventListener('click', e=>{
  const btn = e.target.closest('[data-outlet-filter-clear]');
  if(btn){
    localStorage.removeItem('selectedOutlet');
    updateOutletTriggerLabel();
    renderProductGrid();
    logAnalytic && logAnalytic('outlet_select', { id: null, action:'clear_banner' });
  }
});

// ------ Outlet Selection ------
function ensureOutletTrigger(){
  if(document.querySelector('[data-outlet-trigger]')) return;
  const nav = document.querySelector('header, nav, main');
  if(!nav) return;
  const btn = document.createElement('button');
  btn.type='button';
  btn.dataset.outletTrigger='';
  btn.className='ml-2 px-3 py-1.5 rounded-full text-[11px] font-semibold ring-1 ring-gray-300 hover:bg-gray-50';
  btn.setAttribute('data-i18n','outlet.change');
  btn.textContent = t('outlet.change') || 'Outlet';
  btn.addEventListener('click', openOutletPopup);
  nav.insertBefore(btn, nav.firstChild);
  updateOutletTriggerLabel();
}
function updateOutletTriggerLabel(){
  const btn = document.querySelector('[data-outlet-trigger]'); if(!btn) return;
  const id = loadSelectedOutlet();
  if(!id){ btn.textContent = t('outlet.select') || 'Select Outlet'; return; }
  const outlet = OUTLETS.find(o=>o.id===id);
  btn.textContent = outlet ? outlet.name : (t('outlet.select')||'Select Outlet');
}
function openOutletPopup(){
  if(document.querySelector('[data-outlet-popup]')) return;
  const wrap = document.createElement('div');
  wrap.dataset.outletPopup='';
  wrap.className='fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur';
  const sId = loadSelectedOutlet();
  wrap.innerHTML = `
  <div class="w-full max-w-md bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-soft p-4 flex flex-col gap-4 max-h-[90vh] overflow-auto" role="dialog" aria-modal="true" aria-labelledby="outlet-dialog-title">
    <div class="flex items-center justify-between"><h2 id="outlet-dialog-title" class="font-semibold text-sm" data-i18n="outlet.title">Select Your Outlet</h2><button type="button" data-close class="text-xs font-semibold opacity-70 hover:opacity-100" data-i18n="accessibility.network.close">Close</button></div>
    <div class="relative">
      <input type="search" data-outlet-search placeholder="${t('outlet.search')||'Search outlets'}" class="w-full px-3 py-2 rounded-lg ring-1 ring-gray-300 bg-white dark:bg-slate-700 text-sm" />
      <div class="mt-2 -mb-1 flex items-center justify-between gap-2 text-[11px]" data-outlet-meta hidden>
        <span data-outlet-count></span>
        <button type="button" data-outlet-clear class="text-[10px] font-semibold text-rose-600 hover:underline" data-i18n="outlet.clear">Clear</button>
      </div>
      <div class="mt-3 grid gap-2 text-[12px] max-h-72 overflow-auto" data-outlet-list></div>
    </div>
    <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
      <button type="button" data-all-outlets class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600" data-i18n="outlet.all">All Outlets</button>
      <div class="flex items-center gap-2">
        <button type="button" data-save class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500" data-i18n="outlet.save">Save</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(wrap);
  applyTranslations(currentLang);
  // Focus management
  const triggerBtn = document.querySelector('[data-outlet-trigger]');
  const dialogPanel = wrap.firstElementChild;
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const getFocusable = ()=>[...dialogPanel.querySelectorAll(focusableSelectors)].filter(el=>!el.hasAttribute('disabled'));
  const firstFocus = ()=>{ const el = dialogPanel.querySelector('[data-outlet-search]') || getFocusable()[0]; el && el.focus(); };
  const close = ()=>{ wrap.remove(); triggerBtn && triggerBtn.focus(); document.removeEventListener('keydown', onKey); };
  wrap.addEventListener('click', e=>{ if(e.target===wrap) close(); });
  wrap.querySelector('[data-close]')?.addEventListener('click', close);
  function onKey(e){
    if(e.key==='Escape'){ e.preventDefault(); close(); }
    else if(e.key==='Tab'){
      const f = getFocusable(); if(!f.length) return;
      const i = f.indexOf(document.activeElement);
      if(e.shiftKey && (i<=0)){ e.preventDefault(); f[f.length-1].focus(); }
      else if(!e.shiftKey && (i===f.length-1)){ e.preventDefault(); f[0].focus(); }
    }
  }
  document.addEventListener('keydown', onKey);
  const listEl = wrap.querySelector('[data-outlet-list]');
  function renderList(){
    const q = (wrap.querySelector('[data-outlet-search]')?.value||'').toLowerCase();
    const activeList = OUTLETS.filter(o=>o.active).filter(o=> !q || o.name.toLowerCase().includes(q) || o.city.toLowerCase().includes(q));
    listEl.innerHTML = activeList.map(o=>{
      const checked = o.id=== (wrap.dataset.selectedOutlet || sId) ? 'data-selected="true"' : '';
      return `<button type="button" data-outlet-item="${o.id}" class="flex items-center justify-between px-3 py-2 rounded-lg ring-1 ring-gray-200 text-left hover:bg-gray-50 dark:ring-slate-600 dark:hover:bg-slate-700 data-[selected=true]:bg-indigo-600 data-[selected=true]:text-white" ${checked}><span><span class='font-semibold'>${o.name}</span><span class='ml-1 opacity-70'>${o.city}</span></span><span class="text-[10px] uppercase tracking-wide">${o.region}</span></button>`;
    }).join('');
    const meta = wrap.querySelector('[data-outlet-meta]');
    if(meta){
      if(activeList.length){
        meta.hidden = false;
        const cnt = meta.querySelector('[data-outlet-count]');
        if(cnt){ cnt.textContent = `${activeList.length} / ${OUTLETS.filter(o=>o.active).length}`; }
      } else {
        meta.hidden = true;
      }
    }
  }
  renderList();
  wrap.addEventListener('click', e=>{
    const item = e.target.closest('[data-outlet-item]');
    if(item){
      const id = item.getAttribute('data-outlet-item');
      wrap.dataset.selectedOutlet = id;
      listEl.querySelectorAll('[data-outlet-item]').forEach(b=> b.removeAttribute('data-selected'));
      item.setAttribute('data-selected','true');
    }
  });
  wrap.querySelector('[data-outlet-search]')?.addEventListener('input', renderList);
  // Clear selected outlet in dialog
  wrap.querySelector('[data-outlet-clear]')?.addEventListener('click', ()=>{
    delete wrap.dataset.selectedOutlet;
    renderList();
  });
  // All outlets button acts as immediate clear + save
  wrap.querySelector('[data-all-outlets]')?.addEventListener('click', ()=>{
    localStorage.removeItem('selectedOutlet');
    updateOutletTriggerLabel();
    renderProductGrid();
    logAnalytic && logAnalytic('outlet_select', { id: null });
    window.dispatchEvent(new CustomEvent('outletchange', { detail:{ id: null } }));
    close();
  });
  wrap.querySelector('[data-save]')?.addEventListener('click', ()=>{
    const sel = wrap.dataset.selectedOutlet || sId;
    if(sel){
      saveSelectedOutlet(sel);
      updateOutletTriggerLabel();
      renderProductGrid();
      logAnalytic && logAnalytic('outlet_select', { id: sel });
      window.dispatchEvent(new CustomEvent('outletchange', { detail:{ id: sel } }));
    }
    close();
  });
  // After initial render, focus search
  setTimeout(firstFocus, 0);
}
// High contrast mode
const LS_CONTRAST_KEY = 'contrastMode';
function applyContrastMode(){
  const on = localStorage.getItem(LS_CONTRAST_KEY)==='1';
  document.documentElement.classList.toggle('contrast', on);
}
function ensureContrastToggle(){
  if(document.querySelector('[data-contrast-toggle]')) return;
  const prefRegion = document.querySelector('[data-preferences-panel]') || document.querySelector('main');
  if(!prefRegion) return;
  const row = document.createElement('div');
  row.className='flex items-center justify-between py-2 border-t border-slate-200 dark:border-slate-700';
  row.innerHTML = `<span class="text-sm" data-i18n="accessibility.contrast">High Contrast Mode</span><button type="button" data-contrast-toggle class="w-10 h-6 rounded-full relative transition bg-slate-300 dark:bg-slate-600 data-[on=true]:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500"><span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition data-[on=true]:translate-x-4"></span></button>`;
  prefRegion.appendChild(row);
  const btn = row.querySelector('[data-contrast-toggle]');
  const sync = ()=>{ const on = localStorage.getItem(LS_CONTRAST_KEY)==='1'; btn.dataset.on = on?'true':'false'; };
  sync();
  btn.addEventListener('click', ()=>{
    const on = localStorage.getItem(LS_CONTRAST_KEY)==='1';
    if(on) localStorage.removeItem(LS_CONTRAST_KEY); else localStorage.setItem(LS_CONTRAST_KEY,'1');
    applyContrastMode();
    sync();
  });
  applyTranslations(currentLang);
}

// Queue Debug Modal
function ensureQueueDebugButton(){
  if(document.querySelector('[data-queue-debug-btn]')) return;
  const main = document.querySelector('main'); if(!main) return;
  const btn = document.createElement('button');
  btn.type='button';
  btn.dataset.queueDebugBtn='';
  btn.className='mt-4 text-[11px] font-semibold text-primary hover:underline';
  btn.setAttribute('data-i18n','accessibility.network.queueDebug');
  btn.textContent = t('accessibility.network.queueDebug');
  btn.addEventListener('click', openQueueDebugModal);
  main.appendChild(btn);
  applyTranslations(currentLang);
}
function openQueueDebugModal(){
  if(document.querySelector('[data-queue-debug-modal]')) return;
  const wrap = document.createElement('div');
  wrap.dataset.queueDebugModal='';
  wrap.className='fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur';
  wrap.innerHTML = `
    <div class="w-full max-w-md bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-soft p-4 flex flex-col gap-4 max-h-[90vh] overflow-auto">
      <div class="flex items-center justify-between"><h2 class="font-semibold text-sm" data-i18n="accessibility.network.queueDebug">Queue Debug</h2><button type="button" data-close class="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" data-i18n="accessibility.network.close">Close</button></div>
      <div class="grid gap-3 text-[11px]">
        <div><span class="font-semibold" data-i18n="accessibility.network.queue">Queue</span>: <span data-qd-queue-len>0</span> <span data-i18n="accessibility.network.items">items</span></div>
        <div class="border rounded p-2 bg-slate-50 dark:bg-slate-700/40"><pre class="text-[10px] leading-snug" data-qd-queue-json></pre></div>
        <div class="flex items-center justify-between"><span class="font-semibold" data-i18n="accessibility.network.history">History</span> <div class="flex gap-2"><button type="button" data-qd-export class="text-[10px] font-semibold text-primary hover:underline" data-i18n="accessibility.network.export">Export JSON</button><button type="button" data-qd-failed-export class="text-[10px] font-semibold text-rose-600 hover:underline" data-i18n="perf.failures">Failed Actions</button></div></div>
        <div class="border rounded p-2 bg-rose-50 dark:bg-rose-900/30 hidden" data-qd-failed-panel>
          <div class="flex items-center justify-between mb-2">
            <span class="font-semibold text-rose-700 dark:text-rose-300" data-i18n="failed.title">Failed Actions</span>
            <div class="flex gap-2">
              <button type="button" data-qd-failed-requeue class="text-[10px] font-semibold text-emerald-600 hover:underline" data-i18n="failed.requeueAll">Requeue All</button>
              <button type="button" data-qd-failed-clear class="text-[10px] font-semibold text-rose-600 hover:underline" data-i18n="failed.clearAll">Clear All</button>
            </div>
          </div>
          <div class="max-h-32 overflow-auto text-[10px] leading-snug space-y-1" data-qd-failed-list></div>
        </div>
        <div class="border rounded p-2 bg-slate-50 dark:bg-slate-700/40 max-h-40 overflow-auto text-[10px]" data-qd-history></div>
      </div>
      <div class="flex items-center justify-end gap-2 mt-2">
        <button type="button" data-qd-flush class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500" data-i18n="accessibility.network.flush">Flush Now</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  applyTranslations(currentLang);
  const close = ()=>{ wrap.remove(); };
  wrap.addEventListener('click', e=>{ if(e.target===wrap) close(); });
  wrap.querySelector('[data-close]')?.addEventListener('click', close);
  wrap.querySelector('[data-qd-flush]')?.addEventListener('click', async ()=>{ if(window.replayOfflineQueue) { await window.replayOfflineQueue(); refreshQueueDebugModal(); } else pushToast('No replay fn', {tone:'error'}); });
  wrap.querySelector('[data-qd-export]')?.addEventListener('click', ()=>{
    try {
      const key='offlineSyncHistory';
      const hist = JSON.parse(localStorage.getItem(key)||'[]')||[];
      const blob = new Blob([JSON.stringify(hist,null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='sync-history.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 2000);
    } catch {}
  });
  refreshQueueDebugModal();
  wrap.querySelector('[data-qd-failed-export]')?.addEventListener('click', ()=>{
    const panel = wrap.querySelector('[data-qd-failed-panel]');
    panel?.classList.toggle('hidden');
    if(!panel) return;
    try {
      const list = panel.querySelector('[data-qd-failed-list]');
      const failed = JSON.parse(localStorage.getItem('offlineFailedActions')||'[]')||[];
      list.innerHTML = failed.length ? failed.slice().reverse().map(f=>`<div class='border-b last:border-0 border-rose-200 dark:border-rose-700 pb-1'><code class='block truncate'>${f.action?.type||'?'}</code><span class='opacity-70'>Attempts: ${f.attempts||0}</span></div>`).join('') : `<div data-i18n="accessibility.network.empty">${t('accessibility.network.empty')}</div>`;
      applyTranslations(currentLang);
    } catch(e){ console.error(e); }
  });
  wrap.querySelector('[data-qd-failed-requeue]')?.addEventListener('click', ()=>{
    try {
      const failed = JSON.parse(localStorage.getItem('offlineFailedActions')||'[]')||[];
      if(!failed.length){ pushToast('None to requeue',{tone:'info'}); return; }
      const queue = JSON.parse(localStorage.getItem('offlineActionQueue')||'[]')||[];
      failed.forEach(f=>{ queue.push({ id: Date.now()+':' + Math.random().toString(36).slice(2), ts: Date.now(), action: f.action, attempts:0, nextAttemptAt:0 }); });
      localStorage.setItem('offlineActionQueue', JSON.stringify(queue));
      localStorage.removeItem('offlineFailedActions');
      pushToast('Requeued '+failed.length+' actions', {tone:'success'});
      window.dispatchEvent(new CustomEvent('offlinequeuechange', { detail: { length: queue.length } }));
      if(window.replayOfflineQueue) setTimeout(()=>window.replayOfflineQueue(), 300);
    } catch(e){ console.error(e); }
  });
  wrap.querySelector('[data-qd-failed-clear]')?.addEventListener('click', ()=>{
    if(!confirm('Clear all failed actions?')) return;
    localStorage.removeItem('offlineFailedActions');
    pushToast('Failed actions cleared',{tone:'success'});
    const list = wrap.querySelector('[data-qd-failed-list]'); if(list) list.innerHTML='';
    const failCount = document.querySelector('[data-perf-failures]'); if(failCount) failCount.textContent='0';
  });
}
function refreshQueueDebugModal(){
  const modal = document.querySelector('[data-queue-debug-modal]'); if(!modal) return;
  const qLenEl = modal.querySelector('[data-qd-queue-len]');
  const qJsonEl = modal.querySelector('[data-qd-queue-json]');
  const histEl = modal.querySelector('[data-qd-history]');
  try {
    const q = window.__offlineQueue ? window.__offlineQueue.load() : [];
    if(qLenEl) qLenEl.textContent = q.length;
    if(qJsonEl) qJsonEl.textContent = q.length? JSON.stringify(q, null, 2) : t('accessibility.network.empty');
    const hist = JSON.parse(localStorage.getItem('offlineSyncHistory')||'[]')||[];
    if(hist.length){
      histEl.innerHTML = hist.slice().reverse().map(h=>`<div class='py-1 border-b border-slate-200 dark:border-slate-600 last:border-0'>${new Date(h.ts).toLocaleTimeString()} – ${h.applied}/${h.attempted} applied (${h.remaining} rem) ${h.duration}ms</div>`).join('');
    } else {
      histEl.textContent = t('accessibility.network.empty');
    }
  } catch(e){ if(qJsonEl) qJsonEl.textContent = e.message; }
}
window.addEventListener('offlinequeuechange', refreshQueueDebugModal);
// Inject minimal contrast stylesheet
const contrastStyle = document.createElement('style');
contrastStyle.textContent = `.contrast body{background:#000!important;color:#fff!important}
.contrast .bg-white{background:#000!important}
.contrast .text-muted{color:#ddd!important}
.contrast button, .contrast a{outline-color:#fff}
.contrast [class*='bg-slate-']{background:#000!important}
.contrast [class*='text-slate-']{color:#fff!important}
`;
document.head.appendChild(contrastStyle);
applyContrastMode();

// -------- PWA Install Prompt Handling --------
let __deferredInstallEvent = null;
const LS_INSTALL_DISMISS = 'pwaInstallDismissed';
const LS_INSTALL_DONE = 'pwaInstalledFlag';
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  __deferredInstallEvent = e;
  if(!localStorage.getItem(LS_INSTALL_DONE) && !localStorage.getItem(LS_INSTALL_DISMISS)){
    injectInstallCTA();
  }
});
window.addEventListener('appinstalled', ()=>{
  localStorage.setItem(LS_INSTALL_DONE,'1');
  removeInstallCTA();
  pushToast(t('pwa.installed'), {tone:'success'});
  logAnalytic('pwa_installed',{});
});
function injectInstallCTA(force){
  if(document.querySelector('[data-install-cta]')) return;
  if(!force && (!__deferredInstallEvent || localStorage.getItem(LS_INSTALL_DONE) || localStorage.getItem(LS_INSTALL_DISMISS))) return;
  const target = document.querySelector('main'); if(!target) return;
  const wrap = document.createElement('div');
  wrap.dataset.installCta='';
  wrap.className='mt-4 p-3 rounded-xl border border-primary/40 bg-primary/5 flex items-center justify-between gap-3 text-sm';
  wrap.innerHTML = `<span class="font-semibold" data-i18n="pwa.install">${t('pwa.install')}</span><div class="flex gap-2"><button type="button" data-install-trigger class="px-3 py-1.5 rounded-lg bg-primary text-white font-semibold text-xs">${t('pwa.install')}</button><button type="button" data-install-dismiss class="text-xs font-semibold opacity-70 hover:opacity-100" data-i18n="pwa.dismiss">${t('pwa.dismiss')}</button></div>`;
  target.insertBefore(wrap, target.firstChild);
  applyTranslations(currentLang);
  wrap.querySelector('[data-install-trigger]')?.addEventListener('click', async ()=>{
    logAnalytic('pwa_install_click',{});
    if(__deferredInstallEvent){
      __deferredInstallEvent.prompt();
      const outcome = await __deferredInstallEvent.userChoice.catch(()=>({outcome:'unknown'}));
      logAnalytic('pwa_install_choice',{ outcome: outcome.outcome });
      if(outcome.outcome==='accepted'){
        // Wait for appinstalled event; fallback mark
        setTimeout(()=> localStorage.setItem(LS_INSTALL_DONE,'1'), 3000);
      }
      __deferredInstallEvent = null;
    }
  });
  wrap.querySelector('[data-install-dismiss]')?.addEventListener('click', ()=>{
    localStorage.setItem(LS_INSTALL_DISMISS, Date.now().toString());
    logAnalytic('pwa_install_dismiss',{});
    removeInstallCTA();
  });
}
function removeInstallCTA(){
  document.querySelector('[data-install-cta]')?.remove();
}
function logAnalytic(type,data){
  try {
    const evt = { type, data, ts: Date.now() };
    if(window.__analytics) window.__analytics.push(evt);
    // Persist a rolling buffer in localStorage for funnel metrics
    const LS_KEY = 'analytics:events:v1';
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem(LS_KEY)||'[]'); if(!Array.isArray(arr)) arr=[]; } catch { arr=[]; }
    arr.push(evt);
    // Cap at last 500 events to limit storage usage
    if(arr.length>500) arr = arr.slice(arr.length-500);
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
    // Dispatch custom event for any listeners (e.g., funnel panel)
    window.dispatchEvent(new CustomEvent('analyticslogged', { detail: evt }));
  } catch {}
}
// Helper to compute PWA install funnel metrics from persisted events
window.__computeInstallFunnel = function(){
  const LS_KEY = 'analytics:events:v1';
  let arr=[]; try { arr = JSON.parse(localStorage.getItem(LS_KEY)||'[]'); if(!Array.isArray(arr)) arr=[]; } catch { arr=[]; }
  const metrics = {
    ctaShown: 0,
    ctaClicked: 0,
    promptAccepted: 0,
    promptDismissed: 0,
    installed: 0
  };
  for(const e of arr){
    switch(e.type){
      case 'pwa_install_show': metrics.ctaShown++; break;
      case 'pwa_install_click': metrics.ctaClicked++; break;
      case 'pwa_install_choice': if(e.data && e.data.outcome==='accepted') metrics.promptAccepted++; else if(e.data && e.data.outcome) metrics.promptDismissed++; break;
      case 'pwa_install_dismiss': metrics.promptDismissed++; break;
      case 'pwa_installed': metrics.installed++; break;
    }
  }
  metrics.clickThrough = metrics.ctaShown ? (metrics.ctaClicked/metrics.ctaShown) : 0;
  metrics.acceptRate = metrics.ctaClicked ? (metrics.promptAccepted/metrics.ctaClicked) : 0;
  metrics.installRate = metrics.ctaShown ? (metrics.installed/metrics.ctaShown) : 0;
  return metrics;
};
// Reset analytics events helper
window.__resetAnalyticsEvents = function(){
  try {
    localStorage.removeItem('analytics:events:v1');
    window.dispatchEvent(new CustomEvent('analyticsreset'));
  } catch(e){ console.error(e); }
};
// Test hook to force CTA
window.__forceInstallCTA = ()=>{ injectInstallCTA(true); };

function ensurePerfPanelRefresh(){
  const panel = document.querySelector('[data-perf-panel]'); if(!panel) return;
  const perf = loadPerf();
  const gridAvg = perf.grid && perf.grid.count ? Math.round(perf.grid.total / perf.grid.count) : 0;
  panel.querySelector('[data-perf-grid-avg]').textContent = gridAvg;
  panel.querySelector('[data-perf-grid-count]').textContent = perf.grid?.count||0;
  let offlineMs = getOfflineAccum();
  const start = Number(localStorage.getItem(LS_OFFLINE_START)||'0'); if(start) offlineMs += (Date.now()-start);
  const offEl = panel.querySelector('[data-perf-offline]'); if(offEl) offEl.textContent = Math.floor(offlineMs/1000);
  const lastSync = Number(localStorage.getItem(LS_LAST_SYNC)||'0');
  const lsEl = panel.querySelector('[data-perf-last-sync]'); if(lsEl) lsEl.textContent = shortTime(lastSync);
  const qEl = panel.querySelector('[data-perf-queue]'); if(qEl && window.__offlineQueue) qEl.textContent = window.__offlineQueue.length();
  const failEl = panel.querySelector('[data-perf-failures]'); if(failEl){ try { const failed = JSON.parse(localStorage.getItem('offlineFailedActions')||'[]')||[]; failEl.textContent = failed.length; } catch { failEl.textContent='0'; } }
  const irEl = panel.querySelector('[data-perf-install-rate]');
  if(irEl && typeof window.__computeInstallFunnel==='function'){
    const m = window.__computeInstallFunnel();
    if(m.ctaShown>0) irEl.textContent = (m.installRate*100).toFixed(1)+'%'; else irEl.textContent='-';
  }
  const latEl = panel.querySelector('[data-perf-sync-latency]');
  if(latEl){
    const v = Number(localStorage.getItem('offlineLastLatency')||'0');
    latEl.textContent = v>0 ? v : '-';
  }
  // Latency distribution stats
  try {
    const hist = JSON.parse(localStorage.getItem('offlineLatencyHistory')||'[]')||[];
    if(Array.isArray(hist) && hist.length){
      const values = hist.map(h=>h.ms).filter(n=>typeof n==='number' && n>=0).sort((a,b)=>a-b);
      const sum = values.reduce((a,b)=>a+b,0);
      const avg = Math.round(sum/values.length);
      const idx = (p)=> values[Math.min(values.length-1, Math.max(0, Math.ceil(values.length*p)-1))];
      const p95 = idx(0.95);
      const p90 = idx(0.90);
      const median = values.length %2 ? values[(values.length-1)/2] : Math.round((values[values.length/2 -1] + values[values.length/2])/2);
      const vmax = values[values.length-1];
      const avgEl = panel.querySelector('[data-perf-sync-avg]'); if(avgEl) avgEl.textContent=avg;
      const p95El = panel.querySelector('[data-perf-sync-p95]'); if(p95El) p95El.textContent=p95;
      const p90El = panel.querySelector('[data-perf-sync-p90]'); if(p90El) p90El.textContent=p90;
      const medEl = panel.querySelector('[data-perf-sync-median]'); if(medEl) medEl.textContent=median;
      const maxEl = panel.querySelector('[data-perf-sync-max]'); if(maxEl) maxEl.textContent=vmax;
      const cntEl = panel.querySelector('[data-perf-sync-count]'); if(cntEl) cntEl.textContent=values.length;
      // High latency alert using settings
      try {
        const s = loadSettings();
        const lastAlert = Number(localStorage.getItem('perfLatencyAlertAt')||'0');
        if(p95 > s.latencyAlertThreshold && Date.now()-lastAlert > s.latencyAlertCooldown){
          localStorage.setItem('perfLatencyAlertAt', Date.now().toString());
          if(typeof pushToast==='function') pushToast(t('perf.latencyAlert')+': '+p95+'ms', {tone:'error'});
        }
      } catch {}
    }
  } catch{}
  // Sparkline (unsorted chronological values for shape)
  try {
    const raw = JSON.parse(localStorage.getItem('offlineLatencyHistory')||'[]')||[];
    const spark = panel.querySelector('[data-perf-sync-spark] path');
    if(spark && raw.length){
      const last = raw.slice(-20); // last 20 samples
      const vals = last.map(d=>d.ms);
      const max = Math.max(...vals);
      const min = Math.min(...vals);
      const span = Math.max(1, max-min);
      const w = 80; const h = 20;
      const step = vals.length>1 ? (w/(vals.length-1)) : 0;
      let d='';
      vals.forEach((v,i)=>{
        const x = (i*step).toFixed(2);
        const norm = (v-min)/span;
        const y = (h - norm*h).toFixed(2); // invert so higher latency higher y? choose upward for larger -> lower line; using inverted for typical sparkline (higher latency peaks up) so remove inversion
        // Adjust: want higher latency peaks upward => y = (h - norm*h)
        if(i===0) d += `M${x},${y}`; else d += `L${x},${y}`;
      });
      spark.setAttribute('d', d);
      // Color thresholds: <300ms OK (currentColor), 300-800 warn (amber), >800 alert (red)
      const lastVal = vals[vals.length-1];
      let stroke = 'currentColor';
      if(lastVal>800) stroke = '#dc2626'; else if(lastVal>300) stroke = '#d97706';
      spark.setAttribute('stroke', stroke);
      const svg = panel.querySelector('[data-perf-sync-spark]');
      if(svg){
        // lastVal already defined
        svg.setAttribute('role','img');
        svg.setAttribute('aria-label', `Sync latency trend. Min ${min} ms, Max ${max} ms, Last ${lastVal} ms, Samples ${vals.length}`);
      }
    }
  } catch{}
}
window.addEventListener('offlinesynccomplete', ensurePerfPanelRefresh);
setInterval(ensurePerfPanelRefresh, 5000);

// ---- Cache Info Handling (messages from SW) ----
if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('message', ev => {
    if(!ev.data) return;
    if(ev.data.type === 'CACHE_INFO_RESPONSE'){
      const { summary } = ev.data;
      try {
        const lines = Object.keys(summary).map(k=>`${k}: ${summary[k].entries}`).join('\n');
        pushToast('Caches: '+lines.replace(/\n/g,' | '), {tone:'info', timeout:6000});
        // Offer purge confirm inline via confirm() for simplicity
        if(confirm(t('trends.purgeConfirm'))){
          navigator.serviceWorker.controller?.postMessage({ type:'CACHE_PURGE_REQUEST' });
        }
      } catch {}
    }
    if(ev.data.type === 'CACHE_PURGE_DONE'){
      pushToast(t('cache.purged'), {tone:'success'});
    }
  });
}

// ---------------- Toast System ----------------
let toastContainer;
function ensureToastContainer(){
  if(!toastContainer){
    toastContainer = document.createElement('div');
    toastContainer.className = 'fixed z-[999] top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm space-y-2 pointer-events-none';
    toastContainer.setAttribute('role','status');
    toastContainer.setAttribute('aria-live','polite');
    toastContainer.setAttribute('aria-label', t('a11y.toastRegion'));
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function pushToast(message, opts={}){
  const {tone='info', timeout=4000} = opts;
  const wrap = document.createElement('div');
  wrap.className = 'pointer-events-auto select-none text-sm px-4 py-2 rounded-xl border shadow-soft backdrop-blur bg-white/90 dark:bg-slate-800/80 flex items-start gap-3 animate-fade-in';
  wrap.style.animation = 'fadeIn 0.3s ease';
  wrap.setAttribute('role','alert');
  const colorClasses = tone === 'success' ? 'border-emerald-300/60 text-emerald-700 dark:text-emerald-300' : tone === 'error' ? 'border-red-300/60 text-red-700 dark:text-red-300' : 'border-sky-300/60 text-sky-700 dark:text-sky-300';
  wrap.className += ' ' + colorClasses;
  wrap.innerHTML = `<span class="flex-1">${message}</span><button aria-label="Close" class="text-[11px] opacity-60 hover:opacity-100" data-toast-close>✕</button>`;
  const container = ensureToastContainer();
  container.appendChild(wrap);
  // Auto dismiss
  const timer = setTimeout(()=>dismiss(), timeout);
  function dismiss(){
    clearTimeout(timer);
    if(!wrap.isConnected) return;
    wrap.style.animation = 'fadeOut 0.25s ease forwards';
    setTimeout(()=>wrap.remove(), 250);
  }
  wrap.addEventListener('click',(e)=>{
    if(e.target.closest('[data-toast-close]')) dismiss();
  });
  return dismiss;
}

// Fade animations (inject minimal CSS once)
const toastStyle = document.createElement('style');
toastStyle.textContent = `@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeOut{to{opacity:0;transform:translateY(-4px)}}`;
document.head.appendChild(toastStyle);

// ---------------- Search Handling ----------------
let searchDebounceTimer = null;
function updateSearchClearBtn(){
  const input = document.querySelector('[data-search-input]');
  const clearBtn = document.querySelector('[data-search-clear]');
  if(!input || !clearBtn) return;
  const has = !!input.value.trim();
  clearBtn.classList.toggle('hidden', !has);
  clearBtn.setAttribute('aria-label', t('searchExtra.clear'));
}
document.addEventListener('input',(e)=>{
  const input = e.target.closest('[data-search-input]');
  if(input){
    const val = input.value;
    updateSearchClearBtn();
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(()=>{
      localStorage.setItem('searchQuery', val.trim());
      renderProductGrid();
    }, 180);
  }
});
document.addEventListener('click',(e)=>{
  const clear = e.target.closest('[data-search-clear]');
  if(clear){
    const input = document.querySelector('[data-search-input]');
    if(input){ input.value=''; }
    localStorage.removeItem('searchQuery');
    updateSearchClearBtn();
    renderProductGrid();
  }
});

// ---------------- Gift Vouchers ----------------
// Storage format: giftVouchers = [ { code, value, redeemed, redeemedAt } ]
const LS_GIFT_KEY = 'giftVouchers';
function loadGiftVouchers(){
  try { return JSON.parse(localStorage.getItem(LS_GIFT_KEY)||'[]'); } catch { return []; }
}
function saveGiftVouchers(arr){ localStorage.setItem(LS_GIFT_KEY, JSON.stringify(arr)); }
function normalizeGiftCode(raw){ return (raw||'').trim().toUpperCase(); }
function parseGiftCode(raw){
  const code = normalizeGiftCode(raw);
  if(!code) return null;
  // Example pattern: GV10, GV25, GV50 maps to RM value 10/25/50
  const m = code.match(/^GV(\d{1,3})$/);
  if(m){
    const v = Number(m[1]);
    if(v>0) return { code, value: v };
  }
  // Fallback: CODE:VALUE (e.g., XMAS:20) => value after colon
  const parts = code.split(':');
  if(parts.length===2){
    const val = Number(parts[1]);
    if(Number.isFinite(val) && val>0) return { code: parts[0]+':'+val, value: val };
  }
  return null;
}
function addGiftVoucher(raw){
  const parsed = parseGiftCode(raw);
  if(!parsed) return { ok:false, reason:'invalid' };
  const list = loadGiftVouchers();
  if(list.some(v=>v.code === parsed.code)) return { ok:false, reason:'duplicate' };
  list.push({ code: parsed.code, value: parsed.value, redeemed:false });
  saveGiftVouchers(list);
  return { ok:true, voucher: parsed };
}
function redeemGiftVoucher(code){
  const list = loadGiftVouchers();
  const v = list.find(x=>x.code===code);
  if(!v || v.redeemed) return { ok:false };
  v.redeemed = true;
  v.redeemedAt = Date.now();
  saveGiftVouchers(list);
  // Convert RM value to points using earn rate (value * LOYALTY_REDEEM_RATE?)
  // Simpler: treat RM value as direct currency -> points via earn rate *or* redemption rate.
  // We'll convert 1 RM voucher value into same points as if spent: value * LOYALTY_EARN_RATE
  const earnedPts = Math.floor(v.value * LOYALTY_EARN_RATE);
  if(earnedPts>0) addLoyaltyPoints(earnedPts);
  return { ok:true, earnedPts, value: v.value };
}
function computeGiftStats(vouchers){
  let totalValue = 0, redeemedValue = 0, points = 0;
  vouchers.forEach(v=>{
    totalValue += v.value;
    if(v.redeemed){
      redeemedValue += v.value;
      points += Math.floor(v.value * LOYALTY_EARN_RATE);
    }
  });
  return { totalValue, redeemedValue, points };
}
function fmtRM2(n){ return 'RM' + n.toFixed(2); }
function renderGiftVouchers(){
  const listEl = document.querySelector('[data-gift-list]');
  if(!listEl) return; // not on gift page
  const emptyEl = document.querySelector('[data-gift-empty]');
  const filter = localStorage.getItem('giftFilter') || 'all';
  const vouchers = loadGiftVouchers();
  listEl.innerHTML='';
  // Stats
  const { totalValue, redeemedValue, points } = computeGiftStats(vouchers);
  const tvEl = document.querySelector('[data-gift-total-value]');
  const rvEl = document.querySelector('[data-gift-redeemed-value]');
  const ptEl = document.querySelector('[data-gift-points]');
  if(tvEl) tvEl.textContent = fmtRM2(totalValue);
  if(rvEl) rvEl.textContent = fmtRM2(redeemedValue);
  if(ptEl) ptEl.textContent = points;
  const filtered = vouchers.filter(v=> filter==='all' ? true : filter==='active' ? !v.redeemed : v.redeemed);
  if(!filtered.length){ emptyEl?.classList.remove('hidden'); } else { emptyEl?.classList.add('hidden'); }
  filtered.slice().reverse().forEach(v=>{
    const li = document.createElement('li');
    li.className = 'p-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700/40 flex flex-col gap-2';
    li.innerHTML = `
      <div class="flex justify-between items-center gap-3">
        <div class="grid gap-0.5">
          <span class="text-sm font-semibold tracking-wide">${v.code}</span>
          <span class="text-[11px] text-slate-500 dark:text-slate-400" data-i18n="gift.value">${t('gift.value')}</span>
        </div>
        <div class="text-right font-bold text-primary">RM${v.value.toFixed(2)}</div>
      </div>
      <div class="flex justify-between items-center">
        <button type="button" data-gift-redeem="${v.code}" class="text-xs px-3 py-1.5 rounded-lg font-semibold border border-primary text-primary hover:bg-primary/10 disabled:opacity-40 ${v.redeemed?'hidden':''}" data-i18n="gift.redeem">${t('gift.redeem')}</button>
        <span class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 ${v.redeemed?'':'hidden'}" data-i18n="gift.redeemed">${t('gift.redeemed')}</span>
        <span class="ml-auto text-[11px] text-slate-500 dark:text-slate-400 ${v.redeemed?'':'hidden'}">${v.redeemed && v.redeemedAt ? new Date(v.redeemedAt).toLocaleDateString():''}</span>
      </div>`;
    listEl.appendChild(li);
  });
  // Update filter active states
  document.querySelectorAll('[data-gift-filter]').forEach(btn=>{
    const id = btn.getAttribute('data-gift-filter');
    btn.dataset.active = (id===filter) ? 'true':'false';
  });
  applyTranslations(currentLang); // ensure new labels bilingual
}
document.addEventListener('click',(e)=>{
  const btn = e.target.closest('[data-gift-filter]');
  if(btn){
    const id = btn.getAttribute('data-gift-filter');
    localStorage.setItem('giftFilter', id);
    renderGiftVouchers();
  }
});
document.addEventListener('submit',(e)=>{
  const form = e.target.closest('[data-gift-form]');
  if(form){
    e.preventDefault();
    const input = form.querySelector('[data-gift-input]');
    const errEl = form.querySelector('[data-gift-error]');
    const raw = input.value.trim();
    const res = addGiftVoucher(raw);
    if(!res.ok){
      errEl.textContent = t('gift.invalid');
      return;
    }
    errEl.textContent = '';
    input.value='';
    pushToast(t('gift.added'), {tone:'success'});
    renderGiftVouchers();
  }
});
document.addEventListener('click',(e)=>{
  const redeemBtn = e.target.closest('[data-gift-redeem]');
  if(redeemBtn){
    const code = redeemBtn.getAttribute('data-gift-redeem');
    const res = redeemGiftVoucher(code);
    if(res.ok){
      const msg = t('gift.redeemedToast').replace('{{points}}', res.earnedPts);
      pushToast(msg, {tone:'success'});
      renderGiftVouchers();
      // Update loyalty UI on cart if open
      recalcCart();
    } else {
      pushToast(t('gift.invalid'), {tone:'error'});
    }
  }
});
document.addEventListener('DOMContentLoaded', ()=>{
  renderGiftVouchers();
});

// --- Offline status banner (global) ---
(function(){
  if(document.querySelector('[data-offline-banner]')) return;
  function initOfflineBanner(){
    if(document.querySelector('[data-offline-banner]')) return;
    const bar = document.createElement('div');
  bar.setAttribute('data-offline-banner','');
  bar.setAttribute('role','status');
  bar.setAttribute('aria-live','polite');
  bar.setAttribute('aria-label', t('a11y.offlineNotice') || 'Offline status');
    bar.className = 'fixed top-0 inset-x-0 z-[200] flex items-center justify-center gap-2 text-[13px] font-medium bg-amber-500 text-white py-2 px-3 shadow transition-transform translate-y-[-100%]';
    bar.innerHTML = '<span>⚠️ Offline mode – changes will sync when reconnected</span><button type="button" data-offline-dismiss class="ml-2 text-xs bg-white/20 hover:bg-white/30 rounded px-2 py-1">Hide</button>';
    document.body.appendChild(bar);
    const hide = ()=> bar.style.transform = 'translateY(-100%)';
    const show = ()=> bar.style.transform = 'translateY(0)';
    window.addEventListener('online', ()=> { hide(); try{ pushToast(t('net.backOnline')||'Back online', {tone:'success'}); }catch(_){} });
    window.addEventListener('offline', ()=> show());
    bar.querySelector('[data-offline-dismiss]')?.addEventListener('click', hide);
    if(!navigator.onLine) show();
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initOfflineBanner);
  } else {
    initOfflineBanner();
  }
})();
    // ---------------- Offline Action Queue (Stub) ----------------
    // Purpose: Capture mutating actions while offline & replay when back online.
    // This is a lightweight, synchronous queue stored in localStorage.
    (function(){
      const LS_QUEUE_KEY = 'offlineActionQueue';
      function loadQueue(){
        try { return JSON.parse(localStorage.getItem(LS_QUEUE_KEY)||'[]')||[]; } catch { return []; }
      }
      function saveQueue(q){ localStorage.setItem(LS_QUEUE_KEY, JSON.stringify(q)); }
      const LS_FAILED_KEY = 'offlineFailedActions';
      function loadFailed(){ try { return JSON.parse(localStorage.getItem(LS_FAILED_KEY)||'[]')||[]; } catch { return []; } }
      function saveFailed(f){ localStorage.setItem(LS_FAILED_KEY, JSON.stringify(f)); }
      function enqueue(action){
        const q = loadQueue();
        q.push({ id: Date.now()+':' + Math.random().toString(36).slice(2), ts: Date.now(), action, attempts:0, nextAttemptAt:0 });
        saveQueue(q);
        if(typeof pushToast==='function') pushToast('Queued offline: '+action.type, { tone:'info' });
        window.dispatchEvent(new CustomEvent('offlinequeuechange', { detail: { length: q.length } }));
      }
      async function replay(){
        if(!navigator.onLine) return;
        let q = loadQueue();
        if(!q.length) return;
        // Simulate sending each action to a backend. Here we just apply locally.
        const remaining = [];
        const startTs = Date.now();
        let applied = 0;
        for(const entry of q){
          // Respect backoff schedule
          if(entry.nextAttemptAt && Date.now() < entry.nextAttemptAt){
            remaining.push(entry); continue;
          }
          try {
            const a = entry.action;
            // Route by action.type
            switch(a.type){
              case 'addCartItem': {
                // Expect: { type:'addCartItem', item:{id,name,price,qty} }
                if(a.item && a.item.id){
                  // Reuse existing add logic via custom event to avoid duplicating code
                  document.dispatchEvent(new CustomEvent('queue:addCartItem', { detail: a.item }));
                }
                break;
              }
              case 'placeOrder': {
                // Expect: { type:'placeOrder', snapshot:{} }
                document.dispatchEvent(new CustomEvent('queue:placeOrder', { detail: a.snapshot }));
                break;
              }
              default:
                // Unknown action kept for later (maybe new code will understand)
                remaining.push(entry);
            }
          } catch(e){ remaining.push(entry); }
          // Simulate failure classification: if still in remaining (not applied), increment attempts & schedule backoff
          const wasApplied = !remaining.includes(entry);
          if(!wasApplied){
            entry.attempts = (entry.attempts||0)+1;
            if(entry.attempts >=5){
              // Move to failed list
              try {
                const failed = loadFailed();
                failed.push({ ...entry, failedAt: Date.now() });
                saveFailed(failed);
              } catch {}
              // drop from queue
            } else {
              // Exponential backoff base 1000ms: 1s,2s,4s,8s,16s jitter
              const delay = Math.min(30000, Math.pow(2, entry.attempts-1)*1000);
              const jitter = Math.floor(Math.random()*250);
              entry.nextAttemptAt = Date.now()+delay+jitter;
              remaining[remaining.indexOf(entry)] = entry;
            }
          }
        }
        if(remaining.length){ saveQueue(remaining); } else { localStorage.removeItem(LS_QUEUE_KEY); }
        applied = q.length - remaining.length;
        if(typeof pushToast==='function' && applied>0){
          pushToast('Synced '+applied+' action'+(applied===1?'':'s'), { tone:'success' });
        }
        // Sync history log
        try {
          const key='offlineSyncHistory';
          const hist = JSON.parse(localStorage.getItem(key)||'[]')||[];
          hist.push({ ts:startTs, duration: Date.now()-startTs, attempted:q.length, applied, remaining: remaining.length });
          if(hist.length>50) hist.splice(0, hist.length-50);
          localStorage.setItem(key, JSON.stringify(hist));
        } catch {}
        const newLen = remaining.length;
        window.dispatchEvent(new CustomEvent('offlinequeuechange', { detail: { length: newLen } }));
        // Record latency
        try {
          const lat = Date.now()-startTs;
          localStorage.setItem('offlineLastLatency', String(lat));
          // history
            const hKey='offlineLatencyHistory';
            const hist = JSON.parse(localStorage.getItem(hKey)||'[]')||[];
            hist.push({ ts:startTs, ms:lat });
            try { const s = loadSettings(); if(hist.length> s.latencyHistoryCap) hist.splice(0, hist.length - s.latencyHistoryCap); } catch { if(hist.length>50) hist.splice(0, hist.length-50); }
            localStorage.setItem(hKey, JSON.stringify(hist));
        } catch{}
        window.dispatchEvent(new CustomEvent('offlinesynccomplete', { detail: { latency: Date.now()-startTs } }));
      }
  window.__offlineQueue = { enqueue, replay, load: loadQueue, length: () => loadQueue().length, loadFailed };
      // Public alias for manual triggers
      window.replayOfflineQueue = replay;
      window.addEventListener('online', () => setTimeout(replay, 300));
      // Attempt replay shortly after load

      setTimeout(replay, 1500);
      // Initial event broadcast
      window.dispatchEvent(new CustomEvent('offlinequeuechange', { detail: { length: loadQueue().length } }));
    })();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        console.log('Service worker registered:', reg);
      })
      .catch(err => {
        console.error('Service worker registration failed:', err);
      });
  });
}
