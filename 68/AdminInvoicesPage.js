// src/pages/AdminInvoicesPage.js
import { listInvoices, deleteInvoice, invoicesToCSV } from "../utils/invoice.js";
import { isAdminAuthed, verifyPin, setAdminAuthed } from "../utils/settings.js";

export function AdminInvoicesPage(rootEl) {
  if (!isAdminAuthed()) {
    rootEl.innerHTML = `
      <div class="card">
        <h2 class="title">Admin Lock</h2>
        <div class="helper">Enter Admin PIN to access Invoices.</div>
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
      if (ok){ setAdminAuthed(true); location.hash = "#/invoices"; }
    });
    return () => {};
  }

  rootEl.innerHTML = `
    <div class="card">
      <h2 class="title">Invoices</h2>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px">
        <input id="q" class="input" placeholder="Search by invoice/order/status" style="flex:1"/>
        <select id="sort" class="select"><option value="date">Newest</option><option value="invoice">Invoice #</option><option value="total">Total</option></select>
        <button id="btnExport" class="btn">Export CSV</button>
        <button id="btnRefresh" class="btn">Refresh</button>
      </div>
      <div style="overflow:auto">
        <table style="width:100%; border-collapse:collapse">
          <thead>
            <tr>
              <th style="text-align:left; border-bottom:1px solid var(--border); padding:8px">Invoice #</th>
              <th style="text-align:left; border-bottom:1px solid var(--border); padding:8px">Order</th>
              <th style="text-align:left; border-bottom:1px solid var(--border); padding:8px">Issued</th>
              <th style="text-align:left; border-bottom:1px solid var(--border); padding:8px">Status</th>
              <th style="text-align:right; border-bottom:1px solid var(--border); padding:8px">Total</th>
              <th style="text-align:left; border-bottom:1px solid var(--border); padding:8px">Actions</th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </div>
  `;

  const q = rootEl.querySelector("#q");
  const sortSel = rootEl.querySelector("#sort");
  const rows = rootEl.querySelector("#rows");

  function paint() {
    const text = (q.value || "").toLowerCase();
    let data = listInvoices();
    if (text) {
      data = data.filter(r => (
        r.invoiceNo.toLowerCase().includes(text) ||
        (r.orderId||"").toLowerCase().includes(text) ||
        (r.payment?.status||"").toLowerCase().includes(text)
      ));
    }
    if (sortSel.value === "invoice") data.sort((a,b)=> a.invoiceNo.localeCompare(b.invoiceNo));
    if (sortSel.value === "total") data.sort((a,b)=> b.total - a.total);
    if (sortSel.value === "date") data.sort((a,b)=> (a.issuedAt<b.issuedAt?1:-1));

    rows.innerHTML = "";
    if (!data.length) {
      rows.innerHTML = `<tr><td class="helper" style="padding:10px" colspan="6">No invoices yet.</td></tr>`;
      return;
    }
    data.forEach(r=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding:8px; border-bottom:1px solid var(--border)"><code>${r.invoiceNo}</code></td>
        <td style="padding:8px; border-bottom:1px solid var(--border)">${r.orderId}</td>
        <td style="padding:8px; border-bottom:1px solid var(--border)">${new Date(r.issuedAt).toLocaleString()}</td>
        <td style="padding:8px; border-bottom:1px solid var(--border)">${r.payment?.status || "—"}</td>
        <td style="padding:8px; border-bottom:1px solid var(--border); text-align:right">${r.total.toFixed(2)}</td>
        <td style="padding:8px; border-bottom:1px solid var(--border); display:flex; gap:6px; flex-wrap:wrap">
          <a class="btn" href="#/invoice/${encodeURIComponent(r.token || '')}" id="open-${r.invoiceNo}">Open</a>
          <button class="btn btnDel" data-id="${r.invoiceNo}">Delete</button>
        </td>`;
      rows.appendChild(tr);
      // "Open" simply tries /invoice/ with a missing token: you may generate a fresh link in UI if needed
    });

    rows.querySelectorAll(".btnDel").forEach(b=>{
      b.addEventListener("click", ()=>{
        if (!confirm("Delete invoice record?")) return;
        deleteInvoice(b.dataset.id); paint();
      });
    });
  }

  q.addEventListener("input", paint);
  sortSel.addEventListener("change", paint);
  rootEl.querySelector("#btnRefresh").addEventListener("click", paint);
  rootEl.querySelector("#btnExport").addEventListener("click", ()=>{
    const data = listInvoices();
    const csv = invoicesToCSV(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "invoices.csv"; a.click();
    URL.revokeObjectURL(url);
  });

  paint();
  return () => {};
}
