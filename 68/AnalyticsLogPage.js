// src/pages/AnalyticsLogPage.js
import { isAdminAuthed, verifyPin, setAdminAuthed } from "../utils/settings.js";
import { logAll, logClear } from "../utils/db.js";
import { outboxAll, outboxClear } from "../utils/db.js";
import { flushOutboxOnce } from "../utils/sync.js";
import { getSettings } from "../utils/settings.js";


export function AnalyticsLogPage(rootEl) {
  if (!isAdminAuthed()) {
    rootEl.innerHTML = `
      <div class="card">
        <h2 class="title">Admin Lock</h2>
        <div class="helper">Enter Admin PIN to access Analytics Logs.</div>
        <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap">
          <input id="pin" class="input" type="password" placeholder="Admin PIN" />
          <button id="btnUnlock" class="btn">Unlock</button>
          <a href="#/settings" class="btn">Settings</a>
        </div>
        <div id="msg" class="helper"></div>
      </div>`;
    rootEl.querySelector("#btnUnlock").addEventListener("click", async ()=>{
      const pin = rootEl.querySelector("#pin").value.trim();
      const ok = await verifyPin(pin);
      rootEl.querySelector("#msg").textContent = ok ? "Unlocked." : "Invalid PIN.";
      if (ok) { setAdminAuthed(true); location.hash = "#/analytics"; }
    });
    return () => {};
  }

  rootEl.innerHTML = `
    <div class="card">
      <h2 class="title">Analytics Log</h2>

      <div class="inv-box" style="display:grid; gap:8px">
        <div style="font-weight:800">cURL Generator</div>
        <div class="helper">Builds a POST using your current transport, endpoint & token.</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <button id="btnCurlJson" class="btn">Copy cURL (JSON)</button>
          <button id="btnCurlNdjson" class="btn">Copy cURL (NDJSON)</button>
          <button id="btnCurlBody" class="btn">Copy Body Only</button>
        </div>
        <pre id="curlPreview" class="codebox" style="padding:8px; overflow:auto; max-height:160px"></pre>
      </div>

      <div class="inv-box" style="display:grid; gap:8px">
        <div style="font-weight:800">Server Probe</div>
        <div class="helper">Ping your analytics endpoint and visualize latency.</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center">
          <label>Count <input id="prCount" type="number" class="input" value="10" min="1" style="width:90px"></label>
          <label>Interval (ms) <input id="prInterval" type="number" class="input" value="800" min="100" style="width:110px"></label>
          <button id="btnProbeStart" class="btn">Start</button>
          <button id="btnProbeStop" class="btn">Stop</button>
          <span id="probeStatus" class="helper"></span>
        </div>
        <canvas id="probeCanvas" width="720" height="140" style="width:100%; border:1px solid var(--border); border-radius:10px"></canvas>
        <div id="probeList" class="helper" style="max-height:120px; overflow:auto"></div>
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px">
        <input id="q" class="input" placeholder="Search text/type…" style="flex:1"/>
        <select id="limit" class="select">
          <option value="200">Last 200</option>
          <option value="500" selected>Last 500</option>
          <option value="1000">Last 1000</option>
        </select>
        <button id="btnRefresh" class="btn">Refresh</button>
        <button id="btnSyncNow" class="btn">Sync Now</button>
        <button id="btnClearLogs" class="btn">Clear Logs</button>
        <button id="btnClearOutbox" class="btn">Clear Outbox</button>
        <button id="btnExportNDJSON" class="btn">Export NDJSON</button>
        <button id="btnExportCSV" class="btn">Export CSV</button>
      </div>

      <div style="display:grid; gap:10px">
        <div class="inv-box">
          <div style="font-weight:800; margin-bottom:4px">Outbox (pending)</div>
          <div id="outboxCnt" class="helper"></div>
          <div style="overflow:auto; max-height:220px"><pre id="outbox" style="font-size:12px; line-height:1.4"></pre></div>
        </div>

        <div class="inv-box">
          <div style="font-weight:800; margin-bottom:4px">Logs</div>
          <div style="overflow:auto; max-height:360px">
            <table style="width:100%; border-collapse:collapse">
              <thead><tr>
                <th style="text-align:left; border-bottom:1px solid var(--border); padding:6px">Time</th>
                <th style="text-align:left; border-bottom:1px solid var(--border); padding:6px">Type</th>
                <th style="text-align:left; border-bottom:1px solid var(--border); padding:6px">Message</th>
                <th style="text-align:left; border-bottom:1px solid var(--border); padding:6px">Meta</th>
              </tr></thead>
              <tbody id="rows"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  // --- cURL Generator logic ---
  function buildSamplePayload(transport, events) {
    if (!events || !events.length) {
      events = [{ id: 1, type: "test_event", ts: Date.now(), payload: { hello: "world" } }];
    }
    const wrapper = { app: "myapp", mode: transport === "ndjson" ? "batch" : "single", count: events.length, events };
    if (transport === "ndjson") {
      return (events.map(e => JSON.stringify({ app: "myapp", type: e.type, ts: e.ts, payload: e.payload })).join("\n") + "\n");
    }
    return JSON.stringify(wrapper, null, 2);
  }
  function quoteShell(s){ return `'${String(s).replace(/'/g, `'\\''`)}'`; }

  async function updateCurlPreview(mode) {
    const st = getSettings();
    const url = st.analyticsEndpoint || "https://example.com/collect";
    const token = st.analyticsToken || "";
    const pending = await outboxAll();
    const events = (pending.slice(0, 3).map(p => ({ id: p.id, type: p.kind, ts: p.createdAt, payload: p.payload })));
    const body = buildSamplePayload(mode, events.length ? events : null);

    const headers = [
      `-H ${quoteShell(mode === "ndjson" ? "Content-Type: application/x-ndjson" : "Content-Type: application/json")}`
    ];
    if (token) headers.push(`-H ${quoteShell("Authorization: Bearer " + token)}`);

    const cmd = `curl -X POST ${quoteShell(url)} \\\n  ${headers.join(" \\\n  ")} \\\n  --data-raw ${quoteShell(body)}`;
    const prev = document.getElementById("curlPreview");
    if (prev) prev.textContent = cmd;

    // Copy buttons
    const copy = async (text) => { try { await navigator.clipboard.writeText(text); alert("Copied!"); } catch { prompt("Copy:", text); } };
    document.getElementById("btnCurlJson").onclick = () => copy(cmd.replace("application/x-ndjson","application/json"));
    document.getElementById("btnCurlNdjson").onclick = () => updateCurlPreview("ndjson").then(()=>copy(document.getElementById("curlPreview").textContent));
    document.getElementById("btnCurlBody").onclick = () => copy(body);
  }

  updateCurlPreview("json");

  // --- Server Probe logic ---
  function drawProbeChart(canvas, samples) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);
    // Axes baseline
    ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(30, h-20); ctx.lineTo(w-10, h-20); ctx.stroke();

    if (!samples.length) return;
    const max = Math.max(50, ...samples.map(s=>s.ms));
    const barW = Math.max(4, (w-50)/samples.length - 4);

    samples.forEach((s, i) => {
      const x = 30 + i*(barW+4);
      const barH = Math.round((h-40) * (s.ms / max));
      ctx.fillStyle = s.ok ? "#60a5fa" : "#ef4444";
      ctx.fillRect(x, h-20-barH, barW, barH);
    });

    // max label
    ctx.fillStyle = "#64748b";
    ctx.font = "12px system-ui";
    ctx.fillText(`${Math.round(max)} ms`, 4, 12);
  }

  function probeOnce(url, method="POST") {
    const t0 = performance.now?.() || Date.now();
    return fetch(url, { method, headers: { "Content-Type":"application/json" }, body: "{}" })
      .then(res => ({ ok: res.ok, ms: (performance.now?.()||Date.now()) - t0, status: res.status }))
      .catch(()=> ({ ok:false, ms: (performance.now?.()||Date.now()) - t0, status: 0 }));
  }

  (function setupProbe(){
    const st = getSettings();
    const url = st.analyticsEndpoint || "https://example.com/collect";

    const btnStart = document.getElementById("btnProbeStart");
    const btnStop  = document.getElementById("btnProbeStop");
    const cntEl    = document.getElementById("prCount");
    const intEl    = document.getElementById("prInterval");
    const statusEl = document.getElementById("probeStatus");
    const canvas   = document.getElementById("probeCanvas");
    const listEl   = document.getElementById("probeList");

    let timer = null, i = 0, total = 0, samples = [];

    btnStart.onclick = async () => {
      if (timer) return;
      i = 0; samples = []; total = Number(cntEl.value||10);
      statusEl.textContent = `Probing ${url} ...`;
      listEl.textContent = "";
      drawProbeChart(canvas, samples);

      const step = async () => {
        if (i >= total) { clearInterval(timer); timer=null; statusEl.textContent = `Done (${samples.filter(s=>s.ok).length}/${samples.length} OK)`; return; }
        const res = await probeOnce(url, "POST");
        samples.push(res);
        listEl.textContent = `[${samples.length}] ${Math.round(res.ms)} ms — ${res.ok?"OK":"ERR"} (status ${res.status||"—"})\n` + listEl.textContent;
        drawProbeChart(canvas, samples);
        i++;
      };

      await step();
      const interval = Math.max(100, Number(intEl.value||800));
      timer = setInterval(step, interval);
    };

    btnStop.onclick = () => { if (timer) { clearInterval(timer); timer=null; statusEl.textContent = "Stopped."; } };
  })();

  const q = rootEl.querySelector("#q");
  const limitSel = rootEl.querySelector("#limit");
  const rows = rootEl.querySelector("#rows");
  const outboxPre = rootEl.querySelector("#outbox");
  const outboxCnt = rootEl.querySelector("#outboxCnt");

  async function paint() {
    // Outbox
    const pending = await outboxAll();
    outboxCnt.textContent = `${pending.length} event(s) pending`;
    outboxPre.textContent = JSON.stringify(pending, null, 2);

    // Logs
    const limit = Number(limitSel.value || 500);
    let data = await logAll(limit);
    const query = (q.value || "").toLowerCase();
    if (query) {
      data = data.filter(x =>
        (x.type || "").toLowerCase().includes(query) ||
        (x.msg  || "").toLowerCase().includes(query) ||
        JSON.stringify(x.meta || {}).toLowerCase().includes(query)
      );
    }

    rows.innerHTML = "";
    if (!data.length) {
      rows.innerHTML = `<tr><td class="helper" style="padding:8px" colspan="4">No logs yet.</td></tr>`;
      return;
    }
    data.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding:6px; border-bottom:1px solid var(--border)">${new Date(item.ts).toLocaleString()}</td>
        <td style="padding:6px; border-bottom:1px solid var(--border)">${item.type}</td>
        <td style="padding:6px; border-bottom:1px solid var(--border)">${item.msg}</td>
        <td style="padding:6px; border-bottom:1px solid var(--border); max-width:540px"><code style="font-size:12px">${escapeHtml(JSON.stringify(item.meta || {}))}</code></td>
      `;
      rows.appendChild(tr);
    });
  }

  rootEl.querySelector("#btnRefresh").addEventListener("click", paint);
  limitSel.addEventListener("change", paint);
  q.addEventListener("input", paint);

  rootEl.querySelector("#btnSyncNow").addEventListener("click", async ()=>{
    const res = await flushOutboxOnce();
    alert(res.ok ? `Synced ${res.sent || 0} event(s).` : (res.reason || "Sync failed"));
    paint();
  });
  rootEl.querySelector("#btnClearLogs").addEventListener("click", async ()=>{
    if (!confirm("Clear analytics logs?")) return;
    await logClear(); paint();
  });
  rootEl.querySelector("#btnClearOutbox").addEventListener("click", async ()=>{
    if (!confirm("Clear ALL pending outbox events?")) return;
    await outboxClear(); paint();
  });
  rootEl.querySelector("#btnExportNDJSON").addEventListener("click", async ()=>{
    const data = await logAll(10000);
    const text = data.map(x => JSON.stringify(x)).join("\n") + "\n";
    downloadBlob(text, "text/plain", "analytics-logs.ndjson");
  });
  rootEl.querySelector("#btnExportCSV").addEventListener("click", async ()=>{
    const data = await logAll(10000);
    const rows = [["ts","type","msg","meta"]];
    data.forEach(x => rows.push([x.ts, x.type, x.msg, JSON.stringify(x.meta || {})]));
    const csv = rows.map(r => r.map(v => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(",")).join("\n");
    downloadBlob(csv, "text/csv", "analytics-logs.csv");
  });

  paint();
  return () => {};

  function downloadBlob(text, mime, name){
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }
  function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
}
