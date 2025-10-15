import { getLoyalty, credit, debit } from "../utils/loyalty.js";

export function LoyaltyAdminPage(rootEl) {
  rootEl.innerHTML = `
    <div class="card">
      <h2 class="title">Loyalty Manager</h2>
      <div id="bal" class="helper"></div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin:8px 0">
        <input id="pts" class="input" type="number" placeholder="Points" style="width:140px"/>
        <input id="note" class="input" placeholder="Note / reason" style="min-width:220px; flex:1"/>
        <button id="btnCredit" class="btn">Credit</button>
        <button id="btnDebit" class="btn">Debit</button>
      </div>
      <div style="max-height:50vh; overflow:auto; border:1px solid var(--border); border-radius:10px">
        <table style="width:100%; border-collapse:collapse">
          <thead><tr>
            <th style="text-align:left;border-bottom:1px solid var(--border);padding:6px">Time</th>
            <th style="text-align:left;border-bottom:1px solid var(--border);padding:6px">Type</th>
            <th style="text-align:left;border-bottom:1px solid var(--border);padding:6px">Points</th>
            <th style="text-align:left;border-bottom:1px solid var(--border);padding:6px">Meta</th>
          </tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </div>
  `;
  const $ = (id)=> rootEl.querySelector("#"+id);
  function paint() {
    const s = getLoyalty();
    $("#bal").textContent = `Balance: ${s.balance||0} pts · Entries: ${(s.ledger||[]).length}`;
    const rows = $("#rows"); rows.innerHTML = "";
    (s.ledger||[]).forEach(e => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding:6px;border-bottom:1px solid var(--border)">${new Date(e.ts).toLocaleString()}</td>
        <td style="padding:6px;border-bottom:1px solid var(--border)">${e.type}</td>
        <td style="padding:6px;border-bottom:1px solid var(--border)">${e.points}</td>
        <td style="padding:6px;border-bottom:1px solid var(--border)"><code>${escapeHtml(JSON.stringify(e.meta||{}))}</code></td>
      `;
      rows.appendChild(tr);
    });
  }
  $("#btnCredit").addEventListener("click", ()=> { const n=Number($("#pts").value||0); credit(n, { note: $("#note").value }); paint(); });
  $("#btnDebit").addEventListener("click", ()=> { const n=Number($("#pts").value||0); debit(n, { note: $("#note").value }); paint(); });
  paint();
  return ()=>{};
}
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
