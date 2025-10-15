// src/pages/AnalyticsPage.js
import { readAllOrders, filterOrders, computeMetrics, toCSV, money } from "../utils/analytics.js";
import { getOutlets } from "../utils/outlets.js";

export function AnalyticsPage(rootEl) {
  rootEl.innerHTML = `
    <div class="card">
      <h2 class="title">Analytics</h2>
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin:8px 0">
        <input id="from" class="input" type="date" />
        <input id="to" class="input" type="date" />
        <select id="outlet" class="select"></select>
        <select id="mode" class="select">
          <option value="">All modes</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
        </select>
        <button id="refresh" class="btn">Refresh</button>
        <button id="exportCsv" class="btn">Export CSV</button>
      </div>

      <div id="kpis" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; margin:10px 0"></div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:12px">
        <canvas id="chartMode" height="180"></canvas>
        <canvas id="chartOutlet" height="180"></canvas>
        <canvas id="chartTopItems" height="220"></canvas>
      </div>

      <div style="margin-top:12px">
        <h3 class="title">Promo Usage</h3>
        <div id="promos" style="display:grid; gap:6px"></div>
      </div>
    </div>
  `;

  const $ = (id)=> rootEl.querySelector("#"+id);

  // Populate outlets
  const outs = getOutlets();
  $("#outlet").innerHTML = `<option value="">All outlets</option>` + outs.map(o => `<option value="${o.id}">${o.name}</option>`).join("");

  // Defaults: last 30 days
  const today = new Date(); const d30 = new Date(Date.now() - 29*86400000);
  $("#from").value = d30.toISOString().slice(0,10);
  $("#to").value = today.toISOString().slice(0,10);

  function refresh() {
    const all = readAllOrders();
    const from = $("#from").value ? new Date($("#from").value) : null;
    const to   = $("#to").value ? new Date(new Date($("#to").value).getTime() + 86400000) : null; // inclusive
    const outletId = $("#outlet").value || null;
    const mode = $("#mode").value || null;
    const rows = filterOrders(all, { from, to, outletId, mode });
    const M = computeMetrics(rows);

    // KPIs
    $("#kpis").innerHTML = [
      kpi("Orders", M.orders),
      kpi("Items", M.items),
      kpi("Revenue (net)", fmt(M.revenueNet)),
      kpi("AOV", fmt(M.aov)),
      kpi("Discounts", `− ${fmt(M.discounts)}`),
      kpi("Loyalty", `− ${fmt(M.loyalty)}`),
      kpi("On-time rate", rate(M.timing.onTime, M.timing.onTime + M.timing.late)),
      kpi("Avg to Ready", M.timing.avgReadyMins!=null ? mins(M.timing.avgReadyMins) : "—"),
      kpi("Avg to Complete", M.timing.avgCompleteMins!=null ? mins(M.timing.avgCompleteMins) : "—"),
      kpi("Slots filled", M.slots.total ? `${M.slots.filled}/${M.slots.total}` : "—"),
    ].join("");

    // Charts
    drawBars($("#chartMode"), [
      { label:"Delivery", value: money(M.byMode.delivery.sum), color: "#3b82f6" },
      { label:"Pickup",   value: money(M.byMode.pickup.sum),   color: "#10b981" },
    ]);

    const outletData = Object.entries(M.byOutlet).map(([id,v])=> ({ label:v.name, value: money(v.sum) })).sort((a,b)=>b.value-a.value).slice(0,6);
    drawBars($("#chartOutlet"), outletData);

    const itemData = M.topItems.map(x => ({ label: x.name, value: x.qty })).slice(0,8);
    drawBars($("#chartTopItems"), itemData);

    // Promos
    const promoEl = $("#promos"); promoEl.innerHTML = "";
    const pu = M.promoUsage; const keys = Object.keys(pu);
    if (!keys.length) promoEl.innerHTML = `<div class="helper">No promo usage in range.</div>`;
    else keys.sort().forEach(code => {
      const p = pu[code];
      const row = document.createElement("div");
      row.style.cssText = "display:flex;justify-content:space-between;border:1px solid var(--border);border-radius:10px;padding:6px";
      row.innerHTML = `<div><strong>${code}</strong> <span class="helper">(${p.cnt} uses)</span></div><div>− ${fmt(p.sum)}</div>`;
      promoEl.appendChild(row);
    });

    // Export
    $("#exportCsv").onclick = () => {
      const csvRows = rows.map(o => ({
        id: o.id || o.orderId || "",
        createdAt: o.createdAt || "",
        outletId: o.outletId || "",
        mode: o.mode || o.scheduledMode || "delivery",
        items: (o.items||o.cart||[]).reduce((s,it)=> s+Number(it.qty||1),0),
        subtotal: money((o.items||o.cart||[]).reduce((s,it)=> s + Number(it.price||0)*(Number(it.qty||1)),0)),
        discount: money(o.discountTotal||0),
        loyalty: money(o.loyaltyRedeemValue||0),
        fees: money((o.deliveryFee||0)+(o.serviceFee||0)),
        tax: money(o.tax||0),
        paid: money(o.payableTotal ?? o.totalAfterDiscount ?? o.cartTotal ?? 0),
        status: o.status || "",
        scheduledAt: o.scheduledAt || "",
        readyAt: o.readyAt || "",
        completedAt: o.completedAt || ""
      }));
      const blob = toCSV(csvRows);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `analytics_${$("#from").value}_${$("#to").value}.csv`;
      a.click(); URL.revokeObjectURL(a.href);
    };
  }

  $("#refresh").addEventListener("click", refresh);
  refresh();
  return ()=>{};
}

/* -------- helpers -------- */
function kpi(label, val) {
  return `<div style="border:1px solid var(--border);border-radius:12px;padding:10px">
    <div class="helper">${label}</div>
    <div style="font-weight:800;font-size:20px">${val}</div>
  </div>`;
}
function fmt(n){ return new Intl.NumberFormat(undefined,{style:"currency",currency:"MYR"}).format(Number(n||0)); }
function rate(a,b){ if(!b) return "—"; const r = Math.round((a/b)*100); return `${r}%`; }
function mins(x){ return `${Math.round(Number(x||0))} min`; }

// super-tiny bar chart (no deps)
function drawBars(canvas, series){
  if (!canvas) return;
  const px = (n)=> Math.max(0, Number(n||0));
  const ctx = canvas.getContext("2d");
  const W = canvas.width = canvas.clientWidth || 360;
  const H = canvas.height = canvas.height || 180;
  ctx.clearRect(0,0,W,H);
  ctx.font = "12px system-ui";
  const pad = 28, gap = 8;
  const barW = Math.max(10, (W - pad*2) / (series.length || 1) - gap);
  const maxV = Math.max(1, Math.max(...series.map(s=>s.value)));
  series.forEach((s, i) => {
    const x = pad + i * (barW + gap);
    const h = Math.round((px(s.value)/maxV) * (H - pad*2));
    const y = H - pad - h;
    ctx.fillStyle = s.color || "#6366f1";
    ctx.fillRect(x, y, barW, h);
    // labels
    ctx.fillStyle = "#111827";
    const lab = (s.label||"").toString().slice(0,12);
    ctx.fillText(lab, x, H - pad + 14);
    const vtx = humanNum(s.value);
    ctx.fillText(vtx, x, y - 4);
  });
}
function humanNum(n){
  const x = Number(n||0);
  if (x >= 1e6) return (x/1e6).toFixed(1)+"m";
  if (x >= 1e3) return (x/1e3).toFixed(1)+"k";
  return String(Math.round(x));
}
