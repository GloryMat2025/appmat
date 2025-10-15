// src/components/modals/InvoiceModal.js
import { createModal } from "./modalCore.js";
import { orderStore } from "../../store/orderStore.js";
import { getSettings, isAdminAuthed } from "../../utils/settings.js";
import { getNextInvoiceNumber, bumpInvoiceSequence, issueInvoice } from "../../utils/invoice.js";
import { signSharePayload } from "../../utils/sign.js";
import { createShortLink } from "../../utils/shareLinks.js";
import { enqueueEvent } from "../../utils/sync.js";
import { formatCurrency, formatDateTime } from "../../utils/format.js";

export function InvoiceModal() {
  const s = orderStore.getState();
  const biz = getSettings();
  const { num: invoiceNo } = getNextInvoiceNumber();

  // Build DOM
  const root = document.createElement("div");
  root.className = "invoice";
  root.innerHTML = `
    <div class="invoice-head">
      <div>
        <div class="invoice-brand">${escapeHtml(biz.companyName || "Company")}</div>
        <div class="helper">${escapeHtml(biz.companyRegNo || "")}</div>
        <div class="helper">${escapeHtml(biz.companyTaxId || "")}</div>
        <div class="helper">
          ${[biz.companyAddress1, biz.companyAddress2, biz.companyPostcode && `${biz.companyPostcode} ${biz.companyCity}`, biz.companyState].filter(Boolean).map(escapeHtml).join("<br>")}
        </div>
      </div>
      <div class="inv-meta">
        <div><b>Tax Invoice</b> <span class="inv-badge">${s.payment?.status === "paid" ? "PAID" : "UNPAID"}</span></div>
        <div><b>Invoice #</b> ${invoiceNo}</div>
        <div><b>Date</b> ${formatDateTime(new Date())}</div>
        <div><b>Order</b> ${s.id}</div>
        <div><b>Mode</b> ${s.mode}</div>
      </div>
    </div>

    <div class="inv-section inv-grid">
      <div class="inv-box">
        <div style="font-weight:800; margin-bottom:6px">Bill To</div>
        ${s.mode === "delivery" && s.deliveryAddress ? `
          <div>${escapeHtml(s.deliveryAddress.name || "")}</div>
          <div class="helper">${escapeHtml(s.deliveryAddress.phone || "")}</div>
          <div class="helper">
            ${escapeHtml(s.deliveryAddress.address1 || "")}${s.deliveryAddress.address2 ? ", " + escapeHtml(s.deliveryAddress.address2) : ""}<br>
            ${escapeHtml(s.deliveryAddress.postcode || "")} ${escapeHtml(s.deliveryAddress.city || "")}, ${escapeHtml(s.deliveryAddress.state || "")}
          </div>` : `
          <div>${escapeHtml(s.pickupOutlet?.name || "Walk-in / Pickup")}</div>
          <div class="helper">${escapeHtml(s.pickupOutlet?.address || "")}</div>
        `}
      </div>
      <div class="inv-box">
        <div style="font-weight:800; margin-bottom:6px">Payment</div>
        <div class="helper"><b>Status:</b> ${s.payment?.status || "—"}</div>
        <div class="helper"><b>Method:</b> ${s.payment?.method || "—"}</div>
      </div>
    </div>

    <div class="inv-section">
      <table class="inv-items">
        <thead>
          <tr><th style="width:50%">Item</th><th>Qty</th><th>Unit</th><th style="text-align:right">Line Total</th></tr>
        </thead>
        <tbody id="invBody"></tbody>
      </table>
    </div>

    <div class="inv-totals">
      <div class="inv-row"><span>Subtotal</span><span id="invSubtotal"></span></div>
      <div class="inv-row"><span>Discount${s.promoCode ? ` (${escapeHtml(s.promoCode)})` : ""}</span><span id="invDiscount"></span></div>
      <div class="inv-row"><span>${s.mode === "pickup" ? "Pickup Fee" : "Delivery Fee"}</span><span id="invShip"></span></div>
      <div class="inv-row"><span>Tax ${(Number((s.taxRate||0) * 100)).toFixed(0)}%</span><span id="invTax"></span></div>
      <div class="inv-row inv-grand"><span>Total</span><span id="invTotal"></span></div>
    </div>
  `;

  // Fill items from cart or fallback
  const tbody = root.querySelector("#invBody");
  const cart = Array.isArray(s.cart) ? s.cart : [];
  let computedSubtotal = 0;
  if (cart.length) {
    cart.forEach(it => {
      const qty = Number(it.qty || 1);
      const unit = Number(it.price || 0);
      const line = qty * unit;
      computedSubtotal += line;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(it.name || "Item")}</td>
        <td>${qty}</td>
        <td>${formatCurrency(unit)}</td>
        <td style="text-align:right">${formatCurrency(line)}</td>`;
      tbody.appendChild(tr);
    });
  } else {
    computedSubtotal = Number(s.subtotal || 0);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>Order items</td><td>—</td><td>—</td><td style="text-align:right">${formatCurrency(computedSubtotal)}</td>`;
    tbody.appendChild(tr);
  }

  // Totals
  const discount = Number(s.discount || 0);
  const ship = Number(s.shippingFee || 0);
  const taxable = Math.max(0, computedSubtotal - discount);
  const tax = Math.round(taxable * Number(s.taxRate || 0) * 100) / 100;
  // Loyalty
  const loyaltyUsed = Number(s.loyaltyAppliedPoints || 0);
  const loyaltyValue = Number(s.loyaltyRedeemValue || 0);
  const payable = Number(s.payableTotal ?? (taxable + ship + tax - loyaltyValue));

  root.querySelector("#invSubtotal").textContent = formatCurrency(computedSubtotal);
  root.querySelector("#invDiscount").textContent = `- ${formatCurrency(discount)}`;
  root.querySelector("#invShip").textContent = formatCurrency(ship);
  root.querySelector("#invTax").textContent = formatCurrency(tax);
  // Insert loyalty used row if any
  if (loyaltyUsed > 0) {
    const row = document.createElement("div");
    row.className = "inv-row";
    row.innerHTML = `<span>Loyalty Redeemed</span><span>- ${formatCurrency(loyaltyValue)} (${loyaltyUsed} pts)</span>`;
    root.querySelector(".inv-totals").insertBefore(row, root.querySelector("#invTotal").parentElement);
  }
  root.querySelector("#invTotal").textContent = formatCurrency(payable);
  // Loyalty earned row
  if (typeof window !== "undefined" && window.estEarnPoints) {
    const pts = window.estEarnPoints({ payable });
    if (pts > 0) {
      const row = document.createElement("div");
      row.className = "inv-row";
      row.innerHTML = `<span>Loyalty Earned</span><span>+${pts} pts</span>`;
      root.querySelector(".inv-totals").appendChild(row);
    }
  }

  // Actions
  const btnClose = btn("Close");
  const btnPrint = btn("Print", "primary");
  const btnPdf = btn("Download PDF", "primary");
  const btnShare = btn("Share Link");
  const btnShort = btn("Short Link");
  const policy = getSettings();
  const canShort = !policy.requireAdminForShortLinks || isAdminAuthed();
  btnShort.disabled = !canShort;
  btnShort.title = canShort ? "" : "Admin required (Settings)";

  const modal = createModal({
    title: "Tax Invoice",
    content: root,
    actions: [btnClose, btnShare, btnShort, btnPrint, btnPdf],
    ariaLabel: "Tax invoice modal",
  });

  // Helper to "issue" (persist) once we finalize a number
  function ensureIssued() {
    // Persist invoice record; safe to call multiple times
    issueInvoice({ orderSnapshot: s, invoiceNo, issuedAtISO: new Date().toISOString() });
  }

  btnClose.addEventListener("click", modal.close);
  btnPrint.addEventListener("click", () => {
  ensureIssued();
  enqueueEvent("invoice_issued", { invoiceNo, orderId: s.id, total, mode: s.mode });
  bumpInvoiceSequence();
  window.print();
  });
  btnPdf.addEventListener("click", () => {
  ensureIssued();
  enqueueEvent("invoice_issued", { invoiceNo, orderId: s.id, total, mode: s.mode });
  bumpInvoiceSequence();
  const html = buildPrintHTML({ title: `Invoice ${invoiceNo}`, bodyHTML: root.outerHTML });
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=800");
  if (!w) { alert("Popup blocked. Please allow popups."); return; }
  w.document.open(); w.document.write(html); w.document.close();
  });

  // Share (signed token) opens /invoice/:token
  btnShare.addEventListener("click", async () => {
  ensureIssued();
  enqueueEvent("invoice_share_created", { invoiceNo, orderId: s.id, short: false });
  const payload = buildInvoicePayload(s, invoiceNo);
  const token = await signSharePayload(payload);
  const link = `${location.origin}${location.pathname}#/invoice/${token}`;
  try { await navigator.clipboard.writeText(link); alert("Invoice link copied!"); }
  catch { prompt("Copy this link:", link); }
  });

  // Short link variant (may require Admin)
  btnShort.addEventListener("click", async () => {
    if (!(!policy.requireAdminForShortLinks || isAdminAuthed())) {
      alert("Admin required to create short links"); return;
    }
    ensureIssued();
    enqueueEvent("invoice_share_created", { invoiceNo, orderId: s.id, short: true });
    const payload = buildInvoicePayload(s, invoiceNo);
    const token = await signSharePayload(payload);
    const slug = createShortLink(token, 1440); // 24h default
    const link = `${location.origin}${location.pathname}#/s/${slug}`;
    try { await navigator.clipboard.writeText(link); alert("Short link copied!"); }
    catch { prompt("Copy this link:", link); }
  });

  // Build sanitized invoice payload
  function buildInvoicePayload(state, invoiceNo) {
    return {
      kind: "invoice",
      invoiceNo,
      issuedAt: new Date().toISOString(),
      orderId: state.id,
      mode: state.mode,
      billing: state.mode === "delivery" ? (state.deliveryAddress || null) : (state.pickupOutlet || null),
      payment: state.payment || null,
      promoCode: state.promoCode || null,
      taxRate: state.taxRate || 0,
      subtotal: Number(state.subtotal || 0),
      discount: Number(state.discount || 0),
      shippingFee: Number(state.shippingFee || 0),
      total: Number(state.total || 0),
      items: Array.isArray(state.cart) ? state.cart.map(({name,qty,price})=>({name,qty,price})) : null,
      business: {
        name: policy.companyName, reg: policy.companyRegNo, tax: policy.companyTaxId,
        a1: policy.companyAddress1, a2: policy.companyAddress2, city: policy.companyCity,
        post: policy.companyPostcode, st: policy.companyState,
      },
      currency: policy.currency || "MYR",
    };
  }

  return modal;
}

/* helpers */
function btn(text, variant){
  const b=document.createElement("button");
  b.className = "btn" + (variant ? " " + variant : "");
  b.textContent = text;
  return b;
}
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }

// Minimal print HTML builder (inline CSS + auto print)
function buildPrintHTML({ title="Invoice", bodyHTML }) {
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>
  <style>
    :root{ --border:#e5e7eb; --text:#111827; --sub:#6b7280; }
    @media (prefers-color-scheme: dark){ :root{ --border:#1e2937; --text:#dbe5f1; --sub:#9fb0c7; } }
    body{ font-family: system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif; margin:24px; color:var(--text); }
    .invoice{ width:720px; max-width:92vw; margin:0 auto; }
    .inv-items th,.inv-items td{ border-bottom:1px solid var(--border); }
    .inv-meta{ color:var(--sub); }
    @media print{ body{ margin:0 } .noprint{ display:none !important } }
  </style></head>
  <body>${bodyHTML}
    <div class="noprint" style="text-align:center; margin-top:16px">
      <button onclick="window.print()" style="padding:8px 12px;border:1px solid var(--border);border-radius:10px;cursor:pointer">Print</button>
    </div>
    <script>setTimeout(()=>{ try{ window.print(); }catch(e){} }, 300);</script>
  </body></html>`;
}
