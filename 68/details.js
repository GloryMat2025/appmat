import { getOrderById, fmtMY } from './api.js';

const $ = (s, el = document) => el.querySelector(s);

const statusClass = (st) => ({
  draft:     'bg-gray-100 text-gray-700 ring-gray-200',
  processing:'bg-blue-50 text-blue-700 ring-blue-200',
  packed:    'bg-amber-50 text-amber-700 ring-amber-200',
  shipped:   'bg-indigo-50 text-indigo-700 ring-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  canceled:  'bg-rose-50 text-rose-700 ring-rose-200',
}[st] || 'bg-gray-100 text-gray-700 ring-gray-200');

function renderItem(host, item) {
  const row = $('#row').content.cloneNode(true);
  $('[data-img]', row).src = item.img;
  $('[data-img]', row).alt = item.name;
  $('[data-name]', row).textContent = item.name;
  $('[data-variant]', row).textContent = item.variant || '';
  $('[data-price]', row).textContent = fmtMY(item.price);
  $('[data-qty]', row).textContent = item.qty;

  if (item.preorder) {
    const p = $('[data-preorder]', row);
    p.classList.remove('hidden');
  }
  if (item.note) {
    const n = $('[data-note]', row);
    n.textContent = item.note;
    n.classList.remove('hidden');
  }
  host.appendChild(row);
}

function renderSummary(host, s) {
  host.innerHTML = `
    <dl class="text-sm">
      <div class="flex items-center justify-between py-1">
        <dt class="text-gray-600">Subtotal:</dt><dd class="font-medium">${fmtMY(s.subtotal)}</dd>
      </div>
      <div class="flex items-center justify-between py-1">
        <dt class="text-gray-600">Tax</dt><dd class="font-medium">${fmtMY(s.tax)}</dd>
      </div>
      <div class="flex items-center justify-between py-1">
        <dt class="text-gray-600">Shipping Fee</dt><dd class="font-medium">${fmtMY(s.shippingFee)}</dd>
      </div>
      <div class="flex items-center justify-between py-1">
        <dt class="text-gray-600">Discount</dt><dd class="font-medium ${s.discount > 0 ? 'text-emerald-600' : 'text-rose-600'}">${fmtMY(-Math.abs(s.discount))}</dd>
      </div>
      <div class="border-top mt-2 pt-2 flex items-center justify-between">
        <dt class="text-base font-semibold">Total:</dt><dd class="text-base font-bold">${fmtMY(s.total)}</dd>
      </div>
    </dl>
    <p class="mt-2 text-xs text-gray-600">Rewards ${s.rewards} points</p>
    <p class="mt-3 text-[11px] text-gray-500">Your order includes pre-ordered item and will ship when all items are in stock.</p>
  `;
}

(async function init() {
  const params = new URLSearchParams(location.search);
  const id = params.get('order');
  if (!id) return;

  const order = await getOrderById(id);
  if (!order) {
    document.body.innerHTML = '<main class="max-w-md mx-auto p-4 text-sm text-rose-600">Order not found.</main>';
    return;
  }

  // Header status
  const badge = document.querySelector('[data-status]');
  badge.textContent = order.status;
  badge.className = `ml-auto text-[11px] px-2 py-0.5 rounded-full ring-1 ${statusClass(order.status)}`;

  // Items
  const list = document.querySelector('[data-items]');
  order.items.forEach(it => renderItem(list, it));

  // Summary
  renderSummary(document.querySelector('[data-summary]'), order.summary);

  // Delivery block
  $('[data-address-label]').textContent = order.delivery.addressLabel || 'Address';
  $('[data-address]').textContent = order.delivery.address;
  $('[data-method]').textContent = order.delivery.shippingMethod || 'Standard';
  $('[data-eta]').textContent = order.delivery.shippingEta || '-';

  // Cancel logic (disable if shipped/delivered/canceled)
  const cancelBtn = document.querySelector('[data-cancel]');
  const lock = ['shipped', 'delivered', 'canceled'].includes(order.status);
  cancelBtn.disabled = lock;
  cancelBtn.classList.toggle('opacity-50', lock);

  cancelBtn.addEventListener('click', () => {
    if (lock) return;
    const ok = confirm(`Cancel order ${order.id}?`);
    if (ok) {
      // In real app: call API; here we just show a result page
      location.href = `/assets/pages/orders/details.html?order=${encodeURIComponent(order.id)}#canceled`;
    }
  });

  if (location.hash === '#canceled') {
    badge.textContent = 'canceled';
    badge.className = `ml-auto text-[11px] px-2 py-0.5 rounded-full ring-1 ${statusClass('canceled')}`;
    cancelBtn.disabled = true;
    cancelBtn.classList.add('opacity-50');
  }
})();
