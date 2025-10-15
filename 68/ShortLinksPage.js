import { listShortLinks, resolveShortLink, purgeExpired, deleteShortLink, clearAllShortLinks } from "../utils/shareLinks.js";
import { isAdminAuthed, verifyPin, setAdminAuthed } from "../utils/settings.js";
import { outboxAll, outboxClear } from "../utils/db.js";

if (!isAdminAuthed()) {
    rootEl.innerHTML = `
      <div class="card">
        <h2 class="title">Admin Lock</h2>
        <div class="helper">Enter Admin PIN to access Short Links.</div>
        <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap">
          <input id="pin" class="input" type="password" placeholder="Admin PIN" />
          <button id="btnUnlock" class="btn">Unlock</button>
          <a href="#/settings" class="btn">Settings</a>
        </div>
        <div id="msg" class="helper"></div>
      </div>
    `;
    rootEl.querySelector("#btnUnlock").addEventListener("click", async () => {
      const pin = rootEl.querySelector("#pin").value.trim();
      const ok = await verifyPin(pin);
      rootEl.querySelector("#msg").textContent = ok ? "Unlocked. Redirecting…" : "Invalid PIN.";
      if (ok) { setAdminAuthed(true); location.hash = "#/shortlinks"; }
    });
    return () => {};
  }

  rootEl.innerHTML = `
    <div class="card">
      <h2 class="title">Short Links</h2>
      <div class="helper">Manage expiring receipt links stored locally (offline).</div>

      <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap">
        <button id="btnRefresh" class="btn">Refresh</button>
        <button id="btnPurge" class="btn">Purge expired</button>
        <button id="btnClearAll" class="btn">Clear all</button>
      </div>

      <div style="margin-top:12px; overflow:auto">
        <table style="width:100%; border-collapse:collapse">
          <thead>
            <tr>
              <th style="text-align:left; border-bottom:1px solid #e5e7eb; padding:8px">Slug</th>
              <th style="text-align:left; border-bottom:1px solid #e5e7eb; padding:8px">Status</th>
              <th style="text-align:left; border-bottom:1px solid #e5e7eb; padding:8px">Expires</th>
              <th style="text-align:left; border-bottom:1px solid #e5e7eb; padding:8px">Hits</th>
              <th style="text-align:left; border-bottom:1px solid #e5e7eb; padding:8px">Last access</th>
              <th style="text-align:left; border-bottom:1px solid #e5e7eb; padding:8px">Link</th>
              <th style="text-align:left; border-bottom:1px solid #e5e7eb; padding:8px">Actions</th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>

      <!-- Outbox debug admin UI -->
      <div style="margin-top:8px">
        <button class="btn" id="obList">Outbox (console)</button>
        <button class="btn" id="obClear">Clear Outbox</button>
      </div>
    </div>
  `;

  const rows = rootEl.querySelector("#rows");

  function fmtExpiry(ts) {
    if (!ts) return "Never";
    const left = ts - Date.now();
    if (left <= 0) return "Expired";
    const mins = Math.ceil(left / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
  }

  function paint() {
    rows.innerHTML = "";
    const items = listShortLinks(); // purges expired internally
    if (!items.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" style="padding:10px" class="helper">No short links yet.</td>`;
      rows.appendChild(tr);
      return;
    }

    items.forEach(({ id, token, expiresAt }) => {
      const res = resolveShortLink(id); // increments hits
      const ok = res.ok;
      const shortUrl = `${location.origin}${location.pathname}#/s/${id}`;
      const last = res.lastAccessAt ? new Date(res.lastAccessAt).toLocaleString() : "—";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding:8px; border-bottom:1px solid #f1f5f9"><code>${id}</code></td>
        <td style="padding:8px; border-bottom:1px solid #f1f5f9">${ok ? "Active" : "<span style='color:#b91c1c'>Expired</span>"}</td>
        <td style="padding:8px; border-bottom:1px solid #f1f5f9">${fmtExpiry(expiresAt)}</td>
        <td style="padding:8px; border-bottom:1px solid #f1f5f9">${res.hits || 0}</td>
        <td style="padding:8px; border-bottom:1px solid #f1f5f9">${last}</td>
        <td style="padding:8px; border-bottom:1px solid #f1f5f9"><a href="${shortUrl}" target="_blank">${shortUrl}</a></td>
        <td style="padding:8px; border-bottom:1px solid #f1f5f9; display:flex; gap:6px; flex-wrap:wrap">
          <button class="btn btnCopy" data-url="${shortUrl}">Copy</button>
          <button class="btn btnDelete" data-id="${id}">Delete</button>
          <a class="btn" href="#/receipt/${ok ? res.token : ""}" ${ok ? "" : "style='pointer-events:none;opacity:.5'"}>Open payload</a>
        </td>
      `;
      rows.appendChild(tr);
    });

    // Wire actions
    rows.querySelectorAll(".btnCopy").forEach(b => {
      b.addEventListener("click", async () => {
        const url = b.dataset.url;
        try { await navigator.clipboard.writeText(url); alert("Copied!"); }
        catch { prompt("Copy this link:", url); }
      });
    });
    rows.querySelectorAll(".btnDelete").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.dataset.id;
        deleteShortLink(id);
        paint();
      });
    });
  }

  // Buttons
  rootEl.querySelector("#btnRefresh").addEventListener("click", paint);
  rootEl.querySelector("#btnPurge").addEventListener("click", () => { purgeExpired(); paint(); });
  rootEl.querySelector("#btnClearAll").addEventListener("click", () => {
    if (confirm("Delete ALL short links?")) { clearAllShortLinks(); paint(); }
  });
  rootEl.querySelector("#obList").addEventListener("click", async () => console.log(await outboxAll()));
  rootEl.querySelector("#obClear").addEventListener("click", async () => { await outboxClear(); alert("Outbox cleared."); });

  paint();
  // Optional: live countdown refresh each minute
  const t = setInterval(paint, 60000);
  return () => clearInterval(t);
}
