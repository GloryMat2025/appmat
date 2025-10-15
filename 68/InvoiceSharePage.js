// src/pages/InvoiceSharePage.js
import { verifyAndDecodeShareToken } from "../utils/sign.js";
import { getSettings } from "../utils/settings.js";
import { formatCurrency, formatDateTime } from "../utils/format.js";

export function InvoiceSharePage(rootEl, params = {}) {
  const { token } = params;
  (async () => {
    const res = await verifyAndDecodeShareToken(token || "");
    const settings = getSettings();
    if (!res.ok) return showErr(res.reason || "Invalid link");
    if (settings.requireVerifiedTokens && !res.verified) return showErr("Unverified invoice link is blocked by policy.");

    const d = res.payload;
    if (d.kind !== "invoice") {
      // For backward compatibility you could fallback to receipt view or show error
      return showErr("Not an invoice link.");
    }

    rootEl.innerHTML = `
      <div class="card">
        <h2 class="title">Tax Invoice ${res.verified ? `<span class="helper" style="color:#16a34a">Verified</span>` : `<span class="helper" style="color:#b45309">Legacy</span>`}</h2>
        <div class="invoice">
          <div class="invoice-head">
            <div>
              <div class="invoice-brand">${escape(d.business?.name || "Company")}</div>
              <div class="helper">${escape(d.business?.reg || "")}</div>
              <div class="helper">${escape(d.business?.tax || "")}</div>
              <div class="helper">
                ${[d.business?.a1, d.business?.a2, d.business?.post && `${escape(d.business?.post)} ${escape(d.business?.city||"")}`, d.business?.st].filter(Boolean).join("<br>")}
              </div>
            </div>
            <div class="inv-meta">
              <div><b>Invoice #</b> ${escape(d.invoiceNo)}</div>
              <div><b>Date</b> ${formatDateTime(d.issuedAt)}</div>
              <div><b>Order</b> ${escape(d.orderId || "")}</div>
              <div><b>Mode</b> ${escape(d.mode || "")}</div>
              <div><b>Status</b> ${escape(d.payment?.status || "—")}</div>
            </div>
          </div>

          <div class="inv-section">
            <table class="inv-items">
              <thead><tr><th style="width:50%">Item</th><th>Qty</th><th>Unit</th><th style="text-align:right">Line Total</th></tr></thead>
              <tbody id="invBody"></tbody>
            </table>
          </div>

          <div class="inv-totals">
            <div class="inv-row"><span>Subtotal</span><span id="sub"></span></div>
            <div class="inv-row"><span>Discount${d.promoCode ? ` (${escape(d.promoCode)})` : ""}</span><span id="dis"></span></div>
            <div class="inv-row"><span>${d.mode==="pickup"?"Pickup Fee":"Delivery Fee"}</span><span id="ship"></span></div>
            <div class="inv-row"><span>Tax ${(Number((d.taxRate||0)*100)).toFixed(0)}%</span><span id="tax"></span></div>
            <div class="inv-row inv-grand"><span>Total</span><span id="tot"></span></div>
          </div>
        </div>

        <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap">
          <button id="btnPrint" class="btn">Print</button>
          <a class="btn" href="#/menu">Back</a>
        </div>
      </div>
    `;

    const body = rootEl.querySelector("#invBody");
    let subtotal = 0;
    if (Array.isArray(d.items) && d.items.length) {
      d.items.forEach(it=>{
        const qty = Number(it.qty||1), unit = Number(it.price||0), line = qty*unit;
        subtotal += line;
        const tr=document.createElement("tr");
        tr.innerHTML = `<td>${escape(it.name||"Item")}</td><td>${qty}</td><td>${formatCurrency(unit)}</td><td style="text-align:right">${formatCurrency(line)}</td>`;
        body.appendChild(tr);
      });
    } else {
      subtotal = Number(d.subtotal||0);
      const tr=document.createElement("tr");
      tr.innerHTML = `<td>Order items</td><td>—</td><td>—</td><td style="text-align:right">${formatCurrency(subtotal)}</td>`;
      body.appendChild(tr);
    }

    const discount = Number(d.discount||0);
    const ship = Number(d.shippingFee||0);
    const tax = Math.round(Math.max(0, subtotal - discount) * Number(d.taxRate||0) * 100)/100;
    const total = Math.round((Math.max(0, subtotal - discount) + ship + tax)*100)/100;

    rootEl.querySelector("#sub").textContent = formatCurrency(subtotal);
    rootEl.querySelector("#dis").textContent = `- ${formatCurrency(discount)}`;
    rootEl.querySelector("#ship").textContent = formatCurrency(ship);
    rootEl.querySelector("#tax").textContent = formatCurrency(tax);
    rootEl.querySelector("#tot").textContent = formatCurrency(total);

    rootEl.querySelector("#btnPrint").addEventListener("click", ()=>window.print());
  })();

  function showErr(msg){
    rootEl.innerHTML = `<div class="card"><h2 class="title">Invoice</h2><div class="helper" style="color:#b91c1c">${msg}</div><div style="margin-top:8px"><a class="btn" href="#/menu">Back</a></div></div>`;
  }
  function escape(s){ return String(s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
  return () => {};
}
