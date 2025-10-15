// src/utils/receipt.js
import { formatCurrency, formatDateTime } from "./format.js";
import { t } from "./i18n.js";

export function buildReceiptFromOrder(order) {
  const items = (order.items || order.cart || []).map(it => ({
    name: it.name, qty: it.qty || 1, price: Number(it.price || 0),
    total: round2((it.qty || 1) * Number(it.price || 0))
  }));
  const subtotal = round2(items.reduce((s,x)=>s+x.total, 0));
  const promoDisc = round2(order.discountTotal || 0);
  const loyaltyDisc = round2(order.loyaltyRedeemValue || 0);
  const deliveryFee = round2(order.deliveryFee || 0);
  const serviceFee  = round2(order.serviceFee  || 0);
  const tax         = round2(order.tax || 0);
  const payTotal    = round2(order.payableTotal ?? order.totalAfterDiscount ?? order.cartTotal ?? subtotal + deliveryFee + serviceFee + tax - promoDisc - loyaltyDisc);

  return {
    id: String(order.id || order.orderId || Date.now()),
    createdAt: order.createdAt || new Date().toISOString(),
    mode: order.mode || "delivery",
    status: order.status || "completed",
    customer: sanitize(order.customer || {}),
    address: sanitize(order.address || {}),
    items, subtotal, promoDisc, loyaltyDisc, deliveryFee, serviceFee, tax, payTotal,
    notes: order.notes || "",
    payments: order.payments || [], // [{method, amount}]
    merchant: order.merchant || { name: "MyApp", phone: "", addr: "" },
    currency: order.currency || null,
  };
}

function sanitize(o){ const out = {}; for (const k in (o||{})) { if (o[k] != null) out[k]=o[k]; } return out; }
function round2(n){ return Math.round(Number(n||0)*100)/100; }

export function renderReceiptHTML(rcpt) {
  const line = (left, right, cls="") => `<tr class="${cls}"><td>${left}</td><td class="right">${right}</td></tr>`;
  const extra = (rcpt.deliveryFee>0 || rcpt.deliveryDistKm)
    ? `<div class="muted">Delivery${rcpt.deliveryDistKm?` • ${rcpt.deliveryDistKm.toFixed(1)} km`:``}${rcpt.deliveryZone?` • ${rcpt.deliveryZone}`:``}</div>`
    : "";
  const hdr = `
    <div class="title">${esc(rcpt.merchant?.name || "MyApp Orders")}</div>
    <div class="muted">${esc(rcpt.merchant?.addr || "")}</div>
    <div class="muted">${esc(rcpt.merchant?.phone || "")}</div>
    <div style="margin-top:6px">${t("order.status."+rcpt.status) || rcpt.status} · ${rcpt.mode}</div>
    <div class="muted">${formatDateTime(rcpt.createdAt)} · #${esc(rcpt.id)}</div>
    ${extra}
  `;
  const items = rcpt.items.map(x =>
    `<tr><td>${esc(x.name)} × ${x.qty}</td><td class="right">${fmt(rcpt,x.total)}</td></tr>`
  ).join("");

  const optRows = [
    rcpt.promoDisc > 0 ? line("Discount", "− "+fmt(rcpt, rcpt.promoDisc)) : "",
    rcpt.loyaltyDisc > 0 ? line("Loyalty", "− "+fmt(rcpt, rcpt.loyaltyDisc)) : "",
    rcpt.deliveryFee > 0 ? line("Delivery", fmt(rcpt, rcpt.deliveryFee)) : "",
    rcpt.serviceFee  > 0 ? line("Service fee", fmt(rcpt, rcpt.serviceFee)) : "",
    rcpt.tax         > 0 ? line("Tax", fmt(rcpt, rcpt.tax)) : "",
  ].join("");

  const pays = (rcpt.payments||[]).map(p=> line(esc(p.method||"Paid"), fmt(rcpt, p.amount||rcpt.payTotal))).join("");

  const cust = (rcpt.customer?.name || rcpt.address?.address1)
    ? `<div class="hr"></div>
       <div><strong>Customer</strong></div>
       ${rcpt.customer?.name ? `<div>${esc(rcpt.customer.name)}</div>`:""}
       ${rcpt.customer?.phone ? `<div>${esc(rcpt.customer.phone)}</div>`:""}
       ${(rcpt.address?.address1||rcpt.address?.address) ? `<div class="muted">${esc(rcpt.address.address1||rcpt.address)}</div>`:""}` : "";

  return `
  <div class="receipt">
    ${hdr}
    <div class="hr"></div>
    <table>
      <tbody>
        ${items}
        ${line("<span class='muted'>Subtotal</span>", `<span class='muted'>${fmt(rcpt, rcpt.subtotal)}</span>`)}
        ${optRows}
        ${line("<span class='grand'>Total</span>", `<span class='grand'>${fmt(rcpt, rcpt.payTotal)}</span>`)}
        ${pays}
      </tbody>
    </table>
    ${rcpt.notes ? `<div class="hr"></div><div><strong>Notes</strong></div><div>${esc(rcpt.notes)}</div>` : ""}
    ${cust}
    <div class="hr"></div>
    <div class="muted">Thank you!</div>
  </div>`;
}

function fmt(rcpt, n){ return rcpt.currency ? formatCurrency(n, rcpt.currency) : formatCurrency(n); }
function esc(s){ return String(s||"").replace(/[&<>"]|'?/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
