import { createModal } from "./modalCore.js";
import { orderStore } from "../../stores/orderStore.js";
import { createShortLink } from "../../utils/shareLinks.js";
import { getSettings, isAdminAuthed } from "../../utils/settings.js";
import { signSharePayload } from "../../utils/sign.js";
import { enqueueEvent } from "../../utils/sync.js";

export function ReceiptModal() {
  const s = orderStore.getState();

  // Build receipt DOM
  const root = document.createElement("div");
  root.className = "receipt";

  // Policy banner
  const policy = getSettings();
  const banner = document.createElement("div");
  banner.className = "helper";
  banner.style.marginTop = "8px";
  banner.style.padding = "8px";
  banner.style.border = "1px solid #eef2f7";
  banner.style.borderRadius = "10px";
  banner.style.background = "#f9fafb";
  banner.innerHTML = `
    <b>Share Policy</b>: ${policy.requireVerifiedTokens ? "Verified tokens only." : "Verified preferred; legacy allowed."}
    ${policy.requireAdminForShortLinks ? " • Short links require Admin." : ""}
  `;

  const header = document.createElement("div");
  header.className = "receipt-header";
  header.innerHTML = `
    <div class="receipt-brand">MyApp</div>
    <div class="receipt-meta">
      <div><b>Order:</b> ${s.id}</div>
      <div><b>Date:</b> ${new Date().toLocaleString()}</div>
      <div><b>Mode:</b> ${s.mode}</div>
    </div>
  `;

  const itemsSec = document.createElement("div");
  itemsSec.className = "receipt-section";
  itemsSec.innerHTML = `<div style="font-weight:800; margin-bottom:6px">Items</div>`;

  const table = document.createElement("table");
  table.className = "receipt-items";
  const thead = document.createElement("thead");
  thead.innerHTML = `<tr><th>Item</th><th>Qty</th><th>Price (RM)</th></tr>`;
  const tbody = document.createElement("tbody");

  // Use cart if available; else just show the subtotal line item
  const cart = Array.isArray(s.cart) ? s.cart : [];
  if (cart.length) {
    cart.forEach(it => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(it.name || "Item")}</td>
        <td>${Number(it.qty || 1)}</td>
        <td>${Number(it.price || 0).toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>Order items</td><td>—</td><td>${Number(s.subtotal).toFixed(2)}</td>`;
    tbody.appendChild(tr);
  }

  table.append(thead, tbody);
  itemsSec.appendChild(table);

  const totals = document.createElement("div");
  totals.className = "receipt-totals receipt-section";
  const discount = Number(s.discountTotal ?? s.discount ?? 0);
  const tax = Math.max(0, (s.subtotal - discount)) * (s.taxRate || 0);
  let totalsHtml = `<div class=\"row\"><span>Subtotal</span><span>RM ${Number(s.subtotal).toFixed(2)}</span></div>`;
  if (discount > 0) {
    totalsHtml += `<div class=\"row\"><span>Discount${s.promoCode ? ` (${s.promoCode})` : ""}</span><span>− RM ${discount.toFixed(2)}</span></div>`;
  }
  totalsHtml += `<div class=\"row\"><span>${s.mode === "pickup" ? "Pickup Fee" : "Delivery Fee"}</span><span>RM ${Number(s.shippingFee).toFixed(2)}</span></div>`;
  totalsHtml += `<div class=\"row\"><span>Tax ${(Number((s.taxRate || 0) * 100)).toFixed(0)}%</span><span>RM ${tax.toFixed(2)}</span></div>`;
  // Loyalty points used row
  if (s.loyaltyAppliedPoints && s.loyaltyAppliedPoints > 0) {
    totalsHtml += `<div class=\"row\"><span>Loyalty Redeemed</span><span>− RM ${Number(s.loyaltyRedeemValue || 0).toFixed(2)} (${s.loyaltyAppliedPoints} pts)</span></div>`;
  }
  totalsHtml += `<div class=\"receipt-total\">Total: RM ${Number(s.payableTotal ?? s.totalAfterDiscount ?? s.total ?? (s.subtotal - discount + s.shippingFee + tax)).toFixed(2)}</div>`;
  // Loyalty points earned row
  if (typeof window !== "undefined" && window.estEarnPoints) {
    const pts = window.estEarnPoints({ payable: s.payableTotal ?? s.totalAfterDiscount ?? s.total });
    if (pts > 0) {
      totalsHtml += `<div class=\"row\"><span>Loyalty Earned</span><span>+${pts} pts</span></div>`;
    }
  }
  totals.innerHTML = totalsHtml;

  const footer = document.createElement("div");
  footer.className = "receipt-footer";
  const paid = (s.payment && s.payment.status === "paid") ? `Paid via ${s.payment.method || "Payment"}` : "Payment complete";
  footer.innerHTML = `
    <div>${paid}</div>
    <div class="codebox">
      <canvas id="codeCanvas" width="64" height="64" aria-label="Order code"></canvas>
      <span>${s.id}</span>
    </div>
  `;

  root.append(header, itemsSec, totals, footer);

  // Buttons

  // TTL selector
  const ttlWrap = document.createElement("div");
  ttlWrap.style.marginRight = "auto";
  ttlWrap.className = "helper";
  ttlWrap.innerHTML = `
    <label style="margin-right:6px">Expires in:</label>
    <select id="ttlSel" class="select" style="padding:4px 8px">
      <option value="60">1 hour</option>
      <option value="720">12 hours</option>
      <option value="1440" selected>24 hours</option>
      <option value="10080">7 days</option>
      <option value="0">Never</option>
    </select>
  `;

  const btnClose = btn("Close", "ghost");
  const btnPrint = btn("Print Receipt", "primary");
  const btnPDF = btn("Download PDF", "primary");
  const btnShare = btn("Share Receipt", "primary");
  const btnShort = btn("Copy Short Link", "");

  const modal = createModal({
    title: "Receipt",
    content: [banner, root],
    actions: [ttlWrap, btnClose, btnShare, btnShort, btnPrint, btnPDF],
    ariaLabel: "Order receipt",
  });
  // Gate short link creation by policy/admin
  const canShortLink = !policy.requireAdminForShortLinks || isAdminAuthed();
  btnShort.disabled = !canShortLink;
  btnShort.title = canShortLink ? "" : "Admin required (see Settings)";
  btnShort.addEventListener("click", async () => {
    if (!(!policy.requireAdminForShortLinks || isAdminAuthed())) {
      showToast?.("Admin required to create short links");
      return;
    }
    const sNow = orderStore.getState();
    enqueueEvent("receipt_share_created", { orderId: sNow.id, short: true });
    const payload = {
      id: sNow.id, mode: sNow.mode,
      deliveryAddress: sNow.mode === "delivery" ? (sNow.deliveryAddress || null) : null,
      pickupOutlet: sNow.mode === "pickup" ? (sNow.pickupOutlet || null) : null,
      subtotal: sNow.subtotal, discount: sNow.discount, shippingFee: sNow.shippingFee,
      taxRate: sNow.taxRate, total: sNow.total, promoCode: sNow.promoCode || null,
      cart: Array.isArray(sNow.cart) ? sNow.cart.map(({name,qty,price})=>({name,qty,price})) : null,
      timestamps: sNow.timestamps || {},
    };
    const signed = await signSharePayload(payload);
    const sel = ttlWrap.querySelector("#ttlSel");
    const ttl = sel ? Number(sel.value) : 1440;
    const id = createShortLink(signed, ttl);
    const url = `${location.origin}${location.pathname}#/s/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Short link copied!", "success");
    } catch {
      showToast("Failed to copy link.", "error");
    }
  });
  btnPDF.addEventListener("click", () => {
    // Open a new window with a self-contained receipt and inline CSS, then print
    const win = window.open("", "_blank");
    if (!win) return;
    const css = `
      <style>
        body { background:#fff; margin:0; font-family:system-ui,sans-serif; }
        .receipt { width:min(640px,92vw); border:1px dashed #e5e7eb; border-radius:16px; padding:16px; background:#fff; margin:32px auto; }
        .receipt-header { display:flex; justify-content:space-between; align-items:center; gap:12px; }
        .receipt-brand { font-weight:800; font-size:18px; }
        .receipt-meta { font-size:12px; color:#6b7280; text-align:right; }
        .receipt-section { margin-top:12px; }
        .receipt-items { width:100%; border-collapse:collapse; }
        .receipt-items th, .receipt-items td { padding:8px 0; font-size:14px; border-bottom:1px solid #f1f5f9; }
        .receipt-items th { text-align:left; color:#6b7280; font-weight:600; }
        .receipt-totals { margin-top:8px; display:grid; gap:4px; }
        .receipt-totals .row { display:flex; justify-content:space-between; }
        .receipt-total { font-weight:800; font-size:16px; margin-top:6px; }
        .receipt-footer { margin-top:12px; font-size:12px; color:#6b7280; display:flex; justify-content:space-between; align-items:center; }
        .codebox { border:1px solid #e5e7eb; border-radius:8px; padding:6px; display:inline-flex; align-items:center; gap:8px; }
        .codebox canvas { display:block; background:#f9fafb; border-radius:4px; }
        @media print { body { background:#fff; } .receipt { width:100%!important; border:none; padding:0; margin:0; } }
      </style>
    `;
    // Clone the receipt DOM
    const receipt = root.cloneNode(true);
    // Remove modal buttons if present
    Array.from(receipt.querySelectorAll('.btn')).forEach(b => b.remove());
    // Copy the code canvas as image
    const codeCanvas = root.querySelector('#codeCanvas');
    if (codeCanvas) {
      const img = document.createElement('img');
      img.src = codeCanvas.toDataURL();
      img.width = codeCanvas.width;
      img.height = codeCanvas.height;
      const parent = receipt.querySelector('.codebox');
      if (parent) {
        parent.replaceChild(img, parent.querySelector('canvas'));
      }
    }
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>${css}</head><body>${receipt.outerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 200);
  });

  btnClose.addEventListener("click", modal.close);
  btnPrint.addEventListener("click", () => window.print());

  btnShare.addEventListener("click", async () => {
    const x = orderStore.getState();
    enqueueEvent("receipt_share_created", { orderId: x.id, short: false });
    const payload = {
      id: x.id, mode: x.mode,
      deliveryAddress: x.mode === "delivery" ? (x.deliveryAddress || null) : null,
      pickupOutlet: x.mode === "pickup" ? (x.pickupOutlet || null) : null,
      subtotal: x.subtotal, discount: x.discount, shippingFee: x.shippingFee,
      taxRate: x.taxRate, total: x.total, promoCode: x.promoCode || null,
      cart: Array.isArray(x.cart) ? x.cart.map(({name,qty,price})=>({name,qty,price})) : null,
      timestamps: x.timestamps || {},
    };
    const signed = await signSharePayload(payload);
    const link = `${location.origin}${location.pathname}#/receipt/${signed}`;
    try { await navigator.clipboard.writeText(link); showToast("Share link copied!"); }
    catch { prompt("Copy this link:", link); }
  });

  // Toast helper
  function showToast(msg, type) {
    let toast = document.createElement("div");
    toast.className = `toast toast-${type||'info'}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 2200);
  }

  // Draw a simple order-code pattern (decorative, not a QR)
  setTimeout(() => drawCode(document.getElementById("codeCanvas"), s.id), 0);

  return modal;
// Encode order data as base64url JSON (minimal fields for sharing)

// (encodeSharePayload and decodeSharePayload removed; use signSharePayload/verifyAndDecodeShareToken instead)
}

function btn(text, variant){
  const b=document.createElement("button");
  b.className = "btn " + (variant||"");
  b.textContent=text;
  return b;
}
function escapeHtml(s){ return String(s||"").replace(/[&<>"]|'/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }

// Tiny pattern generator from order id
function drawCode(canvas, id){
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const size = 8; // 8x8 grid
  const cell = canvas.width / size;
  const seed = Array.from(String(id)).reduce((a,c)=>a + c.charCodeAt(0), 0);
  let xorshift = seed || 123456;

  function rnd(){
    // xorshift32-ish
    xorshift ^= xorshift << 13; xorshift ^= xorshift >> 17; xorshift ^= xorshift << 5;
    return Math.abs(xorshift);
  }

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  for (let y=0; y<size; y++){
    for (let x=0; x<size; x++){
      const on = (rnd() % 3) === 0; // ~33% filled
      if (on){
        ctx.fillStyle = "#111827";
        ctx.fillRect(x*cell+1, y*cell+1, cell-2, cell-2);
      }
    }
  }
}
