// src/pages/TestRunnerPage.js
import { TK } from "../utils/testkit.js";

// auto-load specs
import "../tests/specs/coreSmoke.js";
import "../tests/specs/analyticsSmoke.js";

export function TestRunnerPage(rootEl) {
  rootEl.innerHTML = `
    <div class="card">
      <h2 class="title">Test Runner</h2>
      <div class="helper">Run in-app smoke tests (no network required — fetch is mocked).</div>

      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin:8px 0">
        <button id="btnRunAll" class="btn primary">Run All</button>
        <button id="btnRunSelected" class="btn">Run Selected</button>
        <button id="btnExport" class="btn">Export JSON</button>
        <span id="sum" class="helper"></span>
      </div>

      <div style="display:grid; gap:10px; grid-template-columns: 320px 1fr">
        <div style="border:1px solid var(--border); border-radius:10px; padding:8px">
          <div style="font-weight:800; margin-bottom:6px">Tests</div>
          <div id="testList" style="display:grid; gap:6px"></div>
        </div>
        <div style="border:1px solid var(--border); border-radius:10px; padding:8px">
          <div style="font-weight:800; margin-bottom:6px">Results</div>
          <div id="results" style="display:grid; gap:6px; max-height:50vh; overflow:auto"></div>
        </div>
      </div>
    </div>
  `;

  const $ = (id) => rootEl.querySelector("#"+id);
  const resultsEl = $("results");
  const sumEl = $("sum");

  // paint test list
  const list = TK.list();
  const testList = $("testList");
  testList.innerHTML = "";
  list.forEach(t => {
    const row = document.createElement("label");
    row.style.display = "flex"; row.style.alignItems = "center"; row.style.gap = "8px";
    row.innerHTML = `<input type="checkbox" data-id="${t.id}" checked/> <span>${escapeHtml(t.name)}</span>`;
    testList.appendChild(row);
  });

  $("btnRunAll").addEventListener("click", async ()=> run());
  $("btnRunSelected").addEventListener("click", async ()=>{
    const ids = Array.from(testList.querySelectorAll("input[type=checkbox]"))
      .filter(ch => ch.checked).map(ch => ch.getAttribute("data-id"));
    await run(ids);
  });
  $("btnExport").addEventListener("click", ()=> {
    const text = resultsEl.getAttribute("data-json") || "[]";
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `myapp-test-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  });

  async function run(ids = null) {
    resultsEl.innerHTML = "";
    const res = await TK.run(ids, (r) => {
      const div = document.createElement("div");
      div.style.border = "1px solid var(--border)";
      div.style.borderRadius = "8px";
      div.style.padding = "8px";
      div.style.background = r.ok ? "rgba(34,197,94,.10)" : "rgba(239,68,68,.10)";
      div.innerHTML = `
        <div><strong>${escapeHtml(r.name)}</strong></div>
        <div class="helper">id=${r.id} • ${Math.round(r.ms)} ms</div>
        ${r.ok ? "" : `<div style="color:#ef4444"><code>${escapeHtml(r.error || "")}</code></div>`}
      `;
      resultsEl.prepend(div);
      sumEl.textContent = `Passed ${res?.passed ?? 0}/${res?.total ?? 0}`;
    });
    resultsEl.setAttribute("data-json", JSON.stringify(res.results || []));
    sumEl.textContent = `Done: ${res.passed}/${res.total} passed in ${res.ms} ms`;
  }

  return () => {};
}

function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&gt;","\"":"&quot;","'":"&#39;",">":"&gt;"})[m]); }
