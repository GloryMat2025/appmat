// src/pages/ReportsPage.js
import { defaultRange, filterOrders, computeMetrics, seriesByDay, seriesByHour, topItems, promoUsage, splitBy } from "../utils/reports.js";
import { toCSV, downloadBlob } from "../utils/csv.js";
import { formatCurrency } from "../utils/format.js";
import { getOutlets } from "../utils/outlets.js";

export function ReportsPage(rootEl) {
  const dr = defaultRange();
  rootEl.innerHTML = `
    <div class="rep-grid">
      <div class="rep-filters rep-card">
        <label>From <input id="rFrom" class="input" type="date" value="${dr.from}"></label>
        <label>To <input id="rTo" class="input" type="date" value="${dr.to}"></label>
        <select id="rMode" class="select">
          <option value="any">All Modes</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
        </select>
        <select id="rOutlet" class="select"></select>
        <label><input id="rCancelled" type="checkbox"> Include cancelled</label>
        <button id="rRun" class="btn">Run</button>
        <button id="rPrint" class="btn">Print</button>
      </div>

      <div class="rep-kpis">
        <div class="rep-card"><div>Revenue</div><div id="kRevenue" class="num">—</div></div>
        <div class="rep-card"><div>Orders</div><div id="kOrders" class="num">—</div></div>
        <div class="rep-card"><div>AOV</div><div id="kAOV" class="num">—</div></div>
        <div class="rep-card"><div>Discounts</div><div id="kDisc" class="num">—</div></div>
        <div class="rep-card"><div>Loyalty Used</div><div id="kLoy" class="num">—</div></div>
        <div class="rep-card"><div>Tax</div><div id="kTax" class="num">—</div></div>
        <div class="rep-card"><div>Fees</div><div id="kFees" class="num">—</div></div>
      </div>

      <div class="rep-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>Sales by Day</strong>
          <button id="expDaily" class="btn">Export CSV</button>
        </div>
        <canvas id="chartDaily" class="rep-chart" width="800" height="240" aria-label="Sales by day"></canvas>
      </div>

      <div class="rep-card">
        <strong>Orders by Hour</strong>
        <canvas id="chartHour" class="rep-chart" width="800" height="240" aria-label="Orders by hour"></canvas>
      </div>

      <div class="rep-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>Top Items</strong>
          <button id="expItems" class="btn">Export CSV</button>
        </div>
        <table class="rep-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Revenue</th></tr></thead>
          <tbody id="tItems"></tbody>
        </table>
      </div>

      <div class="rep-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>Promo Usage</strong>
          <button id="expPromos" class="btn">Export CSV</button>
        </div>
        <table class="rep-table">
          <thead><tr><th>Code</th><th>Uses</th><th>Discount</th></tr></thead>
          <tbody id="tPromos"></tbody>
        </table>
      </div>

      <div class="rep-card">
        <strong>Split</strong>
        <div class="rep-row"><div>By Mode</div><div id="spMode"></div></div>
        <div class="rep-row"><div>By Outlet</div><div id="spOutlet"></div></div>
      </div>
    </div>
  `;

  const $ = (id)=> rootEl.querySelector("#"+id);

  // Outlet options
  const outlets = [{ id:"any", name:"All Outlets" }, ...getOutlets()];
  $("#rOutlet").innerHTML = outlets.map(o => `<option value="${o.id}">${o.name}</option>`).join("");

  $("#rRun").addEventListener("click", run);
  $("#rPrint").addEventListener("click", ()=> window.print());
  $("#expDaily").addEventListener("click", ()=> {
    const rows = seriesByDay(current.orders).map(x => ({ day:x.day, revenue:x.revenue, orders:x.orders }));
    downloadBlob(toCSV(rows, ["day","revenue","orders"]), fileName("daily"));
  });
  $("#expItems").addEventListener("click", ()=> {
    const rows = topItems(current.orders).map(x => ({ item:x.name, qty:x.qty, revenue:x.revenue }));
    downloadBlob(toCSV(rows, ["item","qty","revenue"]), fileName("items"));
  });
  $("#expPromos").addEventListener("click", ()=> {
    const rows = promoUsage(current.orders).map(x => ({ code:x.code, uses:x.uses, discount:x.discount }));
    downloadBlob(toCSV(rows, ["code","uses","discount"]), fileName("promos"));
  });

  const current = { orders: [] };
  run();

  function run() {
    const q = {
      from: $("#rFrom").value, to: $("#rTo").value,
      mode: $("#rMode").value, outletId: $("#rOutlet").value,
      includeCancelled: $("#rCancelled").checked
    };
    const orders = filterOrders(q);
    current.orders = orders;

    const k = computeMetrics(orders);
    $("#kRevenue").textContent = formatCurrency(k.revenue);
    $("#kOrders").textContent = String(k.orders);
    $("#kAOV").textContent = formatCurrency(k.aov);
    $("#kDisc").textContent = formatCurrency(k.discounts);
    $("#kLoy").textContent = formatCurrency(k.loyalty);
    $("#kTax").textContent = formatCurrency(k.tax);
    $("#kFees").textContent = formatCurrency(k.fees);

    drawDaily($("#chartDaily"), seriesByDay(orders));
    drawHour($("#chartHour"), seriesByHour(orders));

    // Tables
    const items = topItems(orders);
    $("#tItems").innerHTML = items.map(r => `<tr><td>${esc(r.name)}</td><td>${r.qty}</td><td>${formatCurrency(r.revenue)}</td></tr>`).join("") || `<tr><td colspan="3" class="helper">No data</td></tr>`;

    const promos = promoUsage(orders);
    $("#tPromos").innerHTML = promos.map(r => `<tr><td>${esc(r.code)}</td><td>${r.uses}</td><td>${formatCurrency(r.discount)}</td></tr>`).join("") || `<tr><td colspan="3" class="helper">No data</td></tr>`;

    // Splits
    const byMode = splitBy("mode", orders).map(x => `${x.key}: ${x.orders} (${formatCurrency(x.revenue)})`).join(" · ");
    $("#spMode").textContent = byMode || "—";
    const byOutlet = splitBy("outlet", orders).map(x => `${esc(x.name || x.key)}: ${x.orders} (${formatCurrency(x.revenue)})`).join(" · ");
    $("#spOutlet").textContent = byOutlet || "—";
  }

  function fileName(suffix){ const f=$("#rFrom").value, t=$("#rTo").value; return `report_${suffix}_${f}_to_${t}.csv`; }
}

function drawDaily(canvas, data) {
  const ctx = canvas.getContext("2d");
  clear(ctx, canvas);
  if (!data.length) return axis(ctx, canvas);

  const padding = 32;
  const W = canvas.width, H = canvas.height;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const bw = Math.max(8, Math.floor((W - padding*2) / data.length) - 6);
  ctx.font = "12px system-ui";

  // Axes
  ctx.strokeStyle = "#ccc";
  ctx.beginPath(); ctx.moveTo(padding, padding/2); ctx.lineTo(padding, H - padding); ctx.lineTo(W - padding/2, H - padding); ctx.stroke();

  // Bars
  data.forEach((d, i) => {
    const x = padding + 6 + i * (bw + 6);
    const h = Math.round((d.revenue / max) * (H - padding*2));
    const y = H - padding - h;
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(x, y, bw, h);
    // labels
    if (bw > 20) {
      ctx.fillStyle = "#111"; ctx.textAlign = "center";
      ctx.fillText(d.day.slice(5), x + bw/2, H - padding + 14);
    }
  });
}

function drawHour(canvas, data) {
  const ctx = canvas.getContext("2d");
  clear(ctx, canvas);
  const padding = 32;
  const W = canvas.width, H = canvas.height;
  const max = Math.max(...data.map(d => d.orders), 1);
  const step = Math.floor((W - padding*2) / 24);
  ctx.font = "12px system-ui";

  // Axes
  ctx.strokeStyle = "#ccc";
  ctx.beginPath(); ctx.moveTo(padding, padding/2); ctx.lineTo(padding, H - padding); ctx.lineTo(W - padding/2, H - padding); ctx.stroke();

  // Bars
  data.forEach((d, i) => {
    const x = padding + i * step;
    const h = Math.round((d.orders / max) * (H - padding*2));
    const y = H - padding - h;
    ctx.fillStyle = "#10b981";
    ctx.fillRect(x, y, step-2, h);
    // labels
    if (step > 18 && i % 2 === 0) {
      ctx.fillStyle = "#111"; ctx.textAlign = "center";
      ctx.fillText(String(d.hour), x + step/2, H - padding + 14);
    }
  });
}

function clear(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function axis(ctx, canvas) {
  const padding = 32;
  const W = canvas.width, H = canvas.height;
  ctx.strokeStyle = "#ccc";
  ctx.beginPath(); ctx.moveTo(padding, padding/2); ctx.lineTo(padding, H - padding); ctx.lineTo(W - padding/2, H - padding); ctx.stroke();
}

function esc(s) {
  return String(s||"").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
}
