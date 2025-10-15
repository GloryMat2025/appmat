import { verifyAndDecodeShareToken } from "../utils/sign.js";
import { getSettings } from "../utils/settings.js";
import { decodeSharePayload } from "../components/modals/ReceiptModal.js"; // reuse helper
// If you didn't export it, copy the same encode/decode & drawCode functions here.

export function ReceiptSharePage(rootEl, params = {}) {
  const { token } = params; // base64url payload after #/receipt/:token
  

    (async () => {
      const res = await verifyAndDecodeShareToken(token || "");
      const settings = getSettings();

      if (!res.ok) {
        showErr(res.reason || "Invalid token"); return;
      }
      if (settings.requireVerifiedTokens && !res.verified) {
        showErr("This link is not verified and has been blocked by policy."); return;
      }
      if (!settings.requireVerifiedTokens && !settings.allowLegacyFallback && !res.verified) {
        showErr("Legacy (unsigned) links are disabled."); return;
      }

      const data = res.payload;
      const badge = res.legacy ? `<span class=\"helper\" style=\"color:#b45309\">Legacy (unsigned)</span>` :
                                 `<span class=\"helper\" style=\"color:#16a34a\">Verified</span>`;

      rootEl.innerHTML = `
        <div class=\"card\">
          <h2 class=\"title\">Receipt ${badge}</h2>
          <div class=\"receipt\">
            <div class=\"receipt-header\">
              <div class=\"receipt-brand\">MyApp</div>
              <div class=\"receipt-meta\">
                <div><b>Order:</b> ${data.id}</div>
                <div><b>Date:</b> ${new Date().toLocaleString()}</div>
                <div><b>Mode:</b> ${data.mode}</div>
              </div>
            </div>
            <div class=\"receipt-section\">
              <div style=\"font-weight:800; margin-bottom:6px\">Items</div>
              <table class=\"receipt-items\">
                <thead><tr><th>Item</th><th>Qty</th><th>Price (RM)</th></tr></thead>
                <tbody id=\"rb\"></tbody>
              </table>
            </div>
            <div class=\"receipt-totals receipt-section\">
              <div class=\"row\"><span>Subtotal</span><span>RM ${Number(data.subtotal||0).toFixed(2)}</span></div>
              <div class=\"row\"><span>Discount${data.promoCode ? ` (${data.promoCode})` : ""}</span><span>- RM ${Number(data.discount||0).toFixed(2)}</span></div>
              <div class=\"row\"><span>${data.mode==="pickup" ? "Pickup Fee" : "Delivery Fee"}</span><span>RM ${Number(data.shippingFee||0).toFixed(2)}</span></div>
              <div class=\"row\"><span>Tax ${(Number((data.taxRate||0)*100)).toFixed(0)}%</span><span>RM ${Number(Math.max(0,(data.subtotal-data.discount))* (data.taxRate||0)).toFixed(2)}</span></div>
              <div class=\"receipt-total\">Total: RM ${Number(data.total || 0).toFixed(2)}</div>
            </div>
            <div class=\"receipt-footer\">
              <div>Shared receipt</div>
              <div class=\"codebox\">
                <canvas id=\"codeCanvas\" width=\"64\" height=\"64\" data-order-id=\"${data.id}\" aria-label=\"Order code\"></canvas>
                <span>${data.id}</span>
              </div>
            </div>
          </div>
          <div style=\"margin-top:12px; display:flex; gap:8px; flex-wrap:wrap\">
            <button id=\"btnPrint\" class=\"btn\">Print</button>
            <a class=\"btn\" href=\"#/menu\">Back to Menu</a>
          </div>
        </div>
      `;

      // Fill items
      const body = rootEl.querySelector("#rb");
      const cart = Array.isArray(data.cart) ? data.cart : [];
      if (cart.length) {
        cart.forEach(it => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${escapeHtml(it.name||"Item")}</td><td>${Number(it.qty||1)}</td><td>${Number(it.price||0).toFixed(2)}</td>`;
          body.appendChild(tr);
        });
      } else {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>Order items</td><td>—</td><td>${Number(data.subtotal||0).toFixed(2)}</td>`;
        body.appendChild(tr);
      }

      drawCode(document.getElementById("codeCanvas"), data.id);
      rootEl.querySelector("#btnPrint").addEventListener("click", () => window.print());
    })();

    function showErr(message) {
      rootEl.innerHTML = `
        <div class="card">
          <h2 class="title">Receipt</h2>
          <div class="helper" style="color:#b91c1c">${message}</div>
          <div style="margin-top:8px"><a class="btn" href="#/menu">Back to Menu</a></div>
        </div>`;
    }

    return () => {};

    function escapeHtml(s){ return String(s||"").replace(/[&<>"]|'|/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
    function drawCode(canvas, id){
      if (!canvas || !canvas.getContext) return;
      const ctx = canvas.getContext("2d");
      const size = 8, cell = canvas.width / size;
      const seed = Array.from(String(id)).reduce((a,c)=>a + c.charCodeAt(0), 0) || 123456;
      let x = seed;
      function rnd(){ x^=x<<13; x^=x>>17; x^=x<<5; return Math.abs(x); }
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = "#f3f4f6"; ctx.fillRect(0,0,canvas.width,canvas.height);
      for(let y=0;y<size;y++){ for(let xg=0;xg<size;xg++){ if((rnd()%3)===0){ ctx.fillStyle="#111827"; ctx.fillRect(xg*cell+1, y*cell+1, cell-2, cell-2); } } }
    }

  if (!data) {
    rootEl.innerHTML = `
      <div class="card">
        <h2 class="title">Receipt</h2>
        <div class="helper" style="color:#b91c1c">Invalid or missing receipt data.</div>
        <div style="margin-top:8px"><a class="btn" href="#/menu">Back to Menu</a></div>
      </div>`;
    return () => {};
  }

  // Build receipt DOM (mirrors ReceiptModal content)
  rootEl.innerHTML = `
    <div class="card">
      <div class="receipt">
        <div class="receipt-header">
          <div class="receipt-brand">MyApp</div>
          <div class="receipt-meta">
            <div><b>Order:</b> ${data.id}</div>
            <div><b>Date:</b> ${new Date().toLocaleString()}</div>
            <div><b>Mode:</b> ${data.mode}</div>
          </div>
        </div>

        <div class="receipt-section">
          <div style="font-weight:800; margin-bottom:6px">Items</div>
          <table class="receipt-items">
            <thead><tr><th>Item</th><th>Qty</th><th>Price (RM)</th></tr></thead>
            <tbody id="rb"></tbody>
          </table>
        </div>

        <div class="receipt-totals receipt-section">
          <div class="row"><span>Subtotal</span><span>RM ${Number(data.subtotal||0).toFixed(2)}</span></div>
          <div class="row"><span>Discount${data.promoCode ? ` (${data.promoCode})` : ""}</span><span>- RM ${Number(data.discount||0).toFixed(2)}</span></div>
          <div class="row"><span>${data.mode==="pickup" ? "Pickup Fee" : "Delivery Fee"}</span><span>RM ${Number(data.shippingFee||0).toFixed(2)}</span></div>
          <div class="row"><span>Tax ${(Number((data.taxRate||0)*100)).toFixed(0)}%</span><span>RM ${Number(Math.max(0,(data.subtotal-data.discount))* (data.taxRate||0)).toFixed(2)}</span></div>
          <div class="receipt-total">Total: RM ${Number(data.total || 0).toFixed(2)}</div>
        </div>

        <div class="receipt-footer">
          <div>Shared receipt</div>
          <div class="codebox">
            <canvas id="codeCanvas" width="64" height="64" data-order-id="${data.id}" aria-label="Order code"></canvas>
            <span>${data.id}</span>
          </div>
        </div>
      </div>

      <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap">
        <button id="btnPrint" class="btn">Print</button>
        <a class="btn" href="#/menu">Back to Menu</a>
      </div>
    </div>
  `;

  // Fill items
  const body = rootEl.querySelector("#rb");
  const cart = Array.isArray(data.cart) ? data.cart : [];
  if (cart.length) {
    cart.forEach(it => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(it.name||"Item")}</td><td>${Number(it.qty||1)}</td><td>${Number(it.price||0).toFixed(2)}</td>`;
      body.appendChild(tr);
    });
  } else {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>Order items</td><td>—</td><td>${Number(data.subtotal||0).toFixed(2)}</td>`;
    body.appendChild(tr);
  }

  // Draw code
  drawCode(document.getElementById("codeCanvas"), data.id);

  rootEl.querySelector("#btnPrint").addEventListener("click", () => window.print());
  return () => {};

  function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&gt;",">":"&gt;", "\"":"&quot;","'":"&#39;"}[m])); }
  function drawCode(canvas, id){
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const size = 8, cell = canvas.width / size;
    const seed = Array.from(String(id)).reduce((a,c)=>a + c.charCodeAt(0), 0) || 123456;
    let x = seed;
    function rnd(){ x^=x<<13; x^=x>>17; x^=x<<5; return Math.abs(x); }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#f3f4f6"; ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<size;y++){ for(let xg=0;xg<size;xg++){ if((rnd()%3)===0){ ctx.fillStyle="#111827"; ctx.fillRect(xg*cell+1, y*cell+1, cell-2, cell-2); } } }
  }
}
