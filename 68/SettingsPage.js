import { getNotifySettings, setNotifySettings, ensurePermission, notify } from "../utils/notify.js";
  // --- Notifications Section ---
  rootEl.querySelector(".card").insertAdjacentHTML("beforeend", `
<section id="section-notify" style="border:1px solid var(--border); border-radius:12px; padding:12px; display:grid; gap:10px; margin-top:12px">
  <div style="font-weight:800">Notifications</div>
  <label><input id="nfEnable" type="checkbox"> Enable notifications</label>
  <label><input id="nfSound" type="checkbox"> Sound cue</label>
  <label><input id="nfBadge" type="checkbox"> Show app badge count</label>
  <label><input id="nfWake" type="checkbox"> Keep screen on in Kitchen (wake lock)</label>
  <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap">
    <label>Reminder before scheduled time (min) <input id="nfLead" class="input" type="number" min="0" step="1" style="width:120px"></label>
    <button id="nfSave" class="btn">Save</button>
    <button id="nfTest" class="btn">Test Notification</button>
    <span id="nfMsg" class="helper"></span>
  </div>
</section>
`);

  // --- Notifications Section Wiring ---
  import("../utils/notify.js").then(({ getNotifySettings, setNotifySettings, ensurePermission, notify }) => {
    const NS = getNotifySettings();
    const $N = (id)=> rootEl.querySelector("#"+id);
    $N("nfEnable").checked = !!NS.enabled;
    $N("nfSound").checked  = !!NS.sound;
    $N("nfBadge").checked  = !!NS.badge;
    $N("nfWake").checked   = !!NS.wakeLockInKitchen;
    $N("nfLead").value     = NS.leadMinutesReminder;

    $N("nfSave").addEventListener("click", async ()=>{
      setNotifySettings({
        enabled: $N("nfEnable").checked,
        sound: $N("nfSound").checked,
        badge: $N("nfBadge").checked,
        wakeLockInKitchen: $N("nfWake").checked,
        leadMinutesReminder: Math.max(0, Number($N("nfLead").value || 0))
      });
      const perm = await ensurePermission();
      $N("nfMsg").textContent = perm.ok ? "Saved." : "Saved (notifications may be blocked).";
    });
    $N("nfTest").addEventListener("click", async ()=>{
      await ensurePermission();
      notify({ title:"Test notification", body:"If you can see this, notifications work!" });
    });
  });
import { getSettings, setSettings, setAdminPin, isAdminAuthed, setAdminAuthed, verifyPin } from "../utils/settings.js";
import { getTheme, setTheme } from "../utils/theme.js";
import { getLocale, setLocale } from "../utils/i18n.js";
import { getMotionPref, setMotionPref } from "../utils/motion.js";

import { canNotify, requestNotifyPermission } from "../utils/notify.js";
import { notify, setSnoozeUntil, clearSnooze, getSnoozeUntil } from "../utils/notify.js";
import { getSettings, setSettings } from "../utils/settings.js";
import { exportBackup, importBackup, downloadBytes, factoryReset, defaultBackupPlan } from "../utils/backup.js";
import { getFlags, setFlags, isEnabled } from "../utils/flags.js";
import { CommandPalette } from "../components/modals/CommandPalette.js";
import { getScheduleConfig, setScheduleConfig } from "../utils/schedule.js";

export function SettingsPage(rootEl) {

  // --- Language & Locale Section ---
  rootEl.innerHTML = `
    <section id="section-i18n" style="border:1px solid var(--border); border-radius:12px; padding:12px; display:grid; gap:10px; margin-top:12px">
      <div class="title" data-i18n="settings.title">Settings</div>
      <div style="display:grid; gap:8px">
        <label style="display:flex; gap:8px; align-items:center">
          <span data-i18n="settings.lang">Language</span>
          <select id="selLang" class="select" style="padding:6px 10px">
            <option value="en">English</option>
            <option value="ms">Bahasa Melayu</option>
            <option value="ar">العربية (RTL demo)</option>
          </select>
        </label>
        <label style="display:flex; gap:8px; align-items:center">
          <span data-i18n="settings.locale">Locale</span>
          <input id="inpLocale" class="input" placeholder="e.g., en-US, ms-MY" style="max-width:220px"/>
        </label>
        <label style="display:flex; gap:8px; align-items:center">
          <span data-i18n="settings.currency">Currency</span>
          <select id="selCurrency" class="select" style="padding:6px 10px">
            <option>MYR</option><option>SGD</option><option>USD</option><option>EUR</option><option>GBP</option><option>JPY</option>
          </select>
        </label>
        <div id="i18nPreview" class="helper"></div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center">
          <button id="btnSaveI18n" class="btn" data-i18n="settings.save">Save</button>
          <span id="i18nMsg" class="helper"></span>
        </div>
      </div>
    </section>
  ` + rootEl.innerHTML;
  // --- Language & Locale Section Wiring ---
  import("../utils/i18n.js").then(({ setLang, getLang, initI18n, autoI18n }) => {
    import("../utils/format.js").then(({ formatCurrency, formatDateTime }) => {
      const $ = (id) => rootEl.querySelector("#"+id);
      const s = getSettings();
      const selLang = $("selLang");
      const inpLocale = $("inpLocale");
      const selCurrency = $("selCurrency");
      const msg = $("i18nMsg");
      const preview = $("i18nPreview");

      selLang.value = s.lang || getLang() || "en";
      inpLocale.value = s.locale || "";
      selCurrency.value = (s.currency || "MYR").toUpperCase();

      function repaintPreview() {
        const cur = selCurrency.value;
        preview.textContent = `Preview: ${formatDateTime(new Date().toISOString())} • ${formatCurrency(1234.5, cur)}`;
      }
      repaintPreview();

      selLang.addEventListener("change", () => {
        setLang(selLang.value);
        autoI18n(document);
        repaintPreview();
      });
      [inpLocale, selCurrency].forEach(el => el.addEventListener("input", repaintPreview));

      $("btnSaveI18n").addEventListener("click", () => {
        setSettings({
          lang: selLang.value,
          locale: inpLocale.value.trim(),
          currency: selCurrency.value
        });
        initI18n(); autoI18n(document);
        msg.textContent = document.querySelector("[data-i18n='settings.saved']") ? "" : "Saved.";
        if (!msg.textContent) msg.textContent = "";
      });

      autoI18n(rootEl);
    });
  });


  rootEl.innerHTML = `
    <div class="card">
      <h2 class="title">Settings</h2>

      <section style="border:1px solid var(--border); border-radius:12px; padding:12px; display:grid; gap:10px; margin-bottom:12px">
          <div style="font-weight:800">Modules</div>
          <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:center; margin-bottom:8px">
            <label style="display:flex; align-items:center; gap:6px">
              <input type="checkbox" id="ffCore"/> <span>Core Mode</span>
            </label>
            <label style="display:flex; align-items:center; gap:6px">
              <input type="checkbox" id="ffPwa"/> <span>PWA</span>
            </label>
            <label style="display:flex; align-items:center; gap:6px">
              <input type="checkbox" id="ffNotif"/> <span>Notifications</span>
            </label>
            <label style="display:flex; align-items:center; gap:6px">
              <input type="checkbox" id="ffAnalytics"/> <span>Analytics</span>
            </label>
            <label style="display:flex; align-items:center; gap:6px">
              <input type="checkbox" id="ffBackup"/> <span>Backup</span>
            </label>
            <label style="display:flex; align-items:center; gap:6px">
              <input type="checkbox" id="ffKds"/> <span>KDS (Kitchen Display)</span>
            </label>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:4px">
            <button id="btnFlagsSave" class="btn primary">Save</button>
            <button id="btnFlagsMinimal" class="btn">Core Only</button>
            <span id="flagsMsg" class="helper"></span>
          </div>
      </section>

      <section style="border:1px solid #eef2f7; border-radius:12px; padding:12px; display:grid; gap:10px">
        <div style="font-weight:800;">Security</div>

      <label style="display:flex; align-items:center; gap:8px">
        <input type="checkbox" id="chkNotify" ${s.notificationsEnabled ? "checked" : ""}/>
        <span>Enable notifications (status & ETA)</span>
      </label>
      <button id="btnGrantNotif" class="btn">Grant permission</button>
      <div id="notifMsg" class="helper"></div>

      <div style="margin-top:8px; display:grid; gap:8px">
        <div style="font-weight:800">Notification Categories</div>
        <label style="display:flex; align-items:center; gap:8px">
          <input type="checkbox" id="nkStatus"/>
          <span>Status updates (preparing/ready/completed)</span>
        </label>
        <label style="display:flex; align-items:center; gap:8px">
          <input type="checkbox" id="nkEta"/>
          <span>ETA thresholds (15/10/5/0 min)</span>
        </label>

        <div style="font-weight:800; margin-top:4px">Quiet Hours</div>
        <label style="display:flex; align-items:center; gap:8px">
          <input type="checkbox" id="qhEnable"/>
          <span>Enable Quiet Hours</span>
        </label>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap">
          <label>From <input id="qhStart" type="time" class="input" style="padding:6px 10px; width:130px"/></label>
          <label>to <input id="qhEnd" type="time" class="input" style="padding:6px 10px; width:130px"/></label>
        </div>

        <div style="font-weight:800; margin-top:4px">Snooze</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <button id="sn30" class="btn">Snooze 30m</button>
          <button id="sn60" class="btn">Snooze 1h</button>
          <button id="sn120" class="btn">Snooze 2h</button>
          <button id="snClear" class="btn">Clear Snooze</button>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <button id="btnTestNotif" class="btn">Send test notification</button>
        </div>

        <div id="notifState" class="helper"></div>
      </div>

        <label style="display:flex; align-items:center; gap:8px">
          <input type="checkbox" id="chkRequire" ${s.requireVerifiedTokens ? "checked" : ""}/>
          <span>Require <b>verified</b> (HMAC) tokens for receipts</span>
        </label>
        <div class="helper">If enabled, legacy/unsigned share links will be rejected.</div>

        <label style="display:flex; align-items:center; gap:8px">
          <input type="checkbox" id="chkLegacy" ${s.allowLegacyFallback ? "checked" : ""} ${s.requireVerifiedTokens ? "disabled" : ""}/>
          <span>Allow legacy (unsigned) tokens when not required</span>
        </label>

        <label style="display:flex; align-items:center; gap:8px">
          <input type="checkbox" id="chkAdminShort" ${s.requireAdminForShortLinks ? "checked" : ""}/>
          <span>Require Admin to create <b>short links</b></span>
        </label>

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px">
          <input id="pinNew" class="input" placeholder="New Admin PIN" type="password" />
          <button id="btnSetPin" class="btn">Set/Change PIN</button>
          <button id="btnClearSession" class="btn">Lock Admin Session</button>
        </div>
        <div id="msg" class="helper"></div>
      </section>

      <section style="margin-top:12px; border:1px solid #eef2f7; border-radius:12px; padding:12px">
        <div style="font-weight:800">Admin Tools</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px">
          <a class="btn" href="#/outlets">Outlet Manager</a>
          <a class="btn" href="#/zones">Delivery Zones</a>
          <a class="btn" href="#/analytics">Analytics</a>
        </div>
      </section>

      <section style="border:1px solid var(--border); border-radius:12px; padding:12px; display:grid; gap:10px; margin-top:12px">
        <div style="font-weight:800">Business (Tax Invoice)</div>
        <div class="inv-grid">
          <div class="inv-box">
            <div class="helper">Company</div>
            <input id="bizName" class="input" placeholder="Company Name" />
            <input id="bizReg" class="input" placeholder="Company Reg. No" />
            <input id="bizTax" class="input" placeholder="Tax ID (e.g., SST)" />
            <input id="bizA1" class="input" placeholder="Address line 1" />
            <input id="bizA2" class="input" placeholder="Address line 2" />
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px">
              <input id="bizPost" class="input" placeholder="Postcode" />
              <input id="bizCity" class="input" placeholder="City" />
            </div>
            <input id="bizState" class="input" placeholder="State" />
          </div>
          <div class="inv-box">
            <div class="helper" style="margin-top:6px">Invoice Numbering</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center">
              <label>Scheme:</label>
              <select id="invScheme" class="select" style="padding:6px 10px">
                <option value="sequential">Sequential</option>
                <option value="date">Date-based (YYYYMMDD-####)</option>
              </select>
            </div>
            <input id="invPrefix" class="input" placeholder="Prefix e.g. INV-" />
            <input id="invNext" class="input" type="number" min="1" placeholder="Next sequence (e.g., 1)" />
            <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap">
              <button id="btnSaveBiz" class="btn primary">Save Business Settings</button>
            </div>
            <div id="bizMsg" class="helper"></div>
          </div>
        </div>
      </section>

      <section style="border:1px solid var(--border); border-radius:12px; padding:12px; display:grid; gap:10px; margin-top:12px">
        <div style="font-weight:800">Sync & Analytics</div>
        <!-- Feature flag visibility: -->
        <!-- Add id for toggling -->
      </section>
      <section id="section-sync" style="border:1px solid var(--border); border-radius:12px; padding:12px; display:grid; gap:10px; margin-top:12px">

        <label class="helper">Endpoint URL</label>
        <input id="anUrl" class="input" placeholder="https://example.com/collect" />

        <label class="helper">Bearer token (optional)</label>
        <input id="anTok" class="input" placeholder="XYZ..." />

        <label style="display:flex; align-items:center; gap:8px"><input type="checkbox" id="bgSyncEnable"/> <span>Enable Background Sync (when online)</span></label>

        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap">
          <label style="display:flex; align-items:center; gap:8px">
            <input type="checkbox" id="bgPeriodic"/> <span>Periodic Sync</span>
          </label>
          <label>Every <input id="bgPeriod" type="number" min="15" class="input" style="width:100px" /> minutes</label>
        </div>

        <div class="helper" style="margin-top:8px">Batch & Retry</div>
        <label style="display:flex; align-items:center; gap:8px">
          <input type="checkbox" id="anBatched"/> <span>Send in batches</span>
        </label>
        <label>Batch size <input id="anBatchSize" type="number" min="1" max="100" class="input" style="width:100px"/></label>
        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <label>Backoff base (ms) <input id="anBackBase" type="number" class="input" style="width:120px"/></label>
          <label>Backoff max (ms) <input id="anBackMax" type="number" class="input" style="width:120px"/></label>
          <label>Jitter (0..1) <input id="anJitter" type="number" step="0.05" min="0" max="1" class="input" style="width:100px"/></label>
        </div>

        <div class="helper" style="margin-top:8px">Transport</div>
        <label>Format
          <select id="anTransport" class="select" style="padding:6px 10px">
            <option value="json">JSON (default)</option>
            <option value="ndjson">NDJSON (newline-delimited)</option>
          </select>
        </label>

        <div class="helper" style="margin-top:8px">Event kind filters</div>
        <label class="helper">Allowlist (if set, only these kinds are sent)</label>
        <input id="kindAllow" class="input" placeholder="order_status, invoice_issued" />
        <label class="helper">Denylist (these kinds are dropped)</label>
        <input id="kindDeny" class="input" placeholder="test_event" />
        <a class="btn" href="#/analytics">Open Analytics Log</a>

        <div class="helper" style="margin-top:8px">Privacy Filter</div>
        <label>Mode
          <select id="anPrivMode" class="select" style="padding:6px 10px">
            <option value="none">None</option>
            <option value="strip_pii">Strip PII (default)</option>
            <option value="allowlist">Allowlist</option>
            <option value="denylist">Denylist</option>
          </select>
        </label>
        <label class="helper">Allowlist (comma-separated keys)</label>
        <textarea id="anAllow" class="input" rows="2" placeholder="invoiceNo,orderId,status,total"></textarea>
        <label class="helper">Denylist (comma-separated keys)</label>
        <textarea id="anDeny" class="input" rows="2" placeholder="name,phone,email,address,address1,address2,postcode,city,state,tax,token,promoCode"></textarea>

        <div class="helper" style="margin-top:8px">Sampling</div>
        <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap">
          <label style="display:flex; align-items:center; gap:6px">
            Default rate:
            <input id="sampRange" type="range" min="0" max="100" step="1" style="width:180px" />
            <input id="sampNum" type="number" min="0" max="100" step="1" class="input" style="width:80px" />%
          </label>
        </div>
        <label class="helper">Per-kind overrides (one per line: <code>kind=percent</code>)</label>
        <textarea id="sampRules" class="input" rows="3" placeholder="order_status=100\norder_eta_bucket=10\ntest_event=0"></textarea>

        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <button id="btnSaveSync" class="btn primary">Save</button>
          <button id="btnSyncNow" class="btn">Sync Now</button>
          <button id="btnSendTest" class="btn">Send Test Event</button>
        </div>

        <div id="syncMsg" class="helper"></div>
      </section>
    </div>
  `;
  // Business profile wiring
  // Notifications wiring
  setTimeout(() => {
    const chkNotify = rootEl.querySelector("#chkNotify");
    const notifMsg = rootEl.querySelector("#notifMsg");
    const btnGrant = rootEl.querySelector("#btnGrantNotif");
    // Notification categories, quiet hours, snooze, test
    const prefs = getSettings();
    const nkStatus = rootEl.querySelector("#nkStatus");
    const nkEta = rootEl.querySelector("#nkEta");
    const qhEnable = rootEl.querySelector("#qhEnable");
    const qhStart = rootEl.querySelector("#qhStart");
    const qhEnd = rootEl.querySelector("#qhEnd");
    const stateEl = rootEl.querySelector("#notifState");

    nkStatus.checked = !!(prefs.notifyKinds?.status ?? true);
    nkEta.checked = !!(prefs.notifyKinds?.eta ?? true);
    qhEnable.checked = !!prefs.quietHoursEnabled;
    qhStart.value = prefs.quietStart || "22:00";
    qhEnd.value = prefs.quietEnd || "08:00";

    function saveKinds() {
      setSettings({ notifyKinds: { status: nkStatus.checked, eta: nkEta.checked } });
      stateEl.textContent = "Notification categories updated.";
    }
    nkStatus.addEventListener("change", saveKinds);
    nkEta.addEventListener("change", saveKinds);

    qhEnable.addEventListener("change", () => {
      setSettings({ quietHoursEnabled: qhEnable.checked });
      stateEl.textContent = "Quiet Hours " + (qhEnable.checked ? "enabled" : "disabled") + ".";
    });
    [qhStart, qhEnd].forEach(inp => inp.addEventListener("change", () => {
      setSettings({ quietStart: qhStart.value || "22:00", quietEnd: qhEnd.value || "08:00" });
      stateEl.textContent = "Quiet Hours window saved.";
    }));

    // Snooze buttons
    rootEl.querySelector("#sn30").addEventListener("click", ()=>{ setSnoozeUntil(new Date(Date.now()+30*60000).toISOString()); stateEl.textContent="Snoozed 30 minutes."; });
    rootEl.querySelector("#sn60").addEventListener("click", ()=>{ setSnoozeUntil(new Date(Date.now()+60*60000).toISOString()); stateEl.textContent="Snoozed 1 hour."; });
    rootEl.querySelector("#sn120").addEventListener("click", ()=>{ setSnoozeUntil(new Date(Date.now()+120*60000).toISOString()); stateEl.textContent="Snoozed 2 hours."; });
    rootEl.querySelector("#snClear").addEventListener("click", ()=>{ clearSnooze(); stateEl.textContent="Snooze cleared."; });

    // Test notification
    rootEl.querySelector("#btnTestNotif").addEventListener("click", async ()=>{
      if (!canNotify()) { const res = await requestNotifyPermission(); if (res !== "granted") { stateEl.textContent="Permission not granted."; return; } }
      const ok = await notify({ title:"Test notification", body:"Hello from MyApp 👋", tag:"test", kind:"status" });
      stateEl.textContent = ok ? `Sent. Snooze until: ${getSnoozeUntil() || "—"}` : "Suppressed by policy.";
    });
    if (btnGrant) {
      btnGrant.addEventListener("click", async () => {
        const res = await requestNotifyPermission();
        notifMsg.textContent = res === "granted" ? "Notifications enabled in browser." :
                                           (res === "denied" ? "Permission denied." : "Not supported.");
      });
    }
    if (chkNotify) {
      chkNotify.addEventListener("change", () => {
        setSettings({ notificationsEnabled: chkNotify.checked });
        notifMsg.textContent = "Notification preference saved.";
      });
    }
  }, 0);
  const biz = getSettings();
  const byId = id => rootEl.querySelector("#"+id);
  byId("bizName").value = biz.companyName || "";
  byId("bizReg").value  = biz.companyRegNo || "";
  byId("bizTax").value  = biz.companyTaxId || "";
  byId("bizA1").value   = biz.companyAddress1 || "";
  byId("bizA2").value   = biz.companyAddress2 || "";
  byId("bizPost").value = biz.companyPostcode || "";
  byId("bizCity").value = biz.companyCity || "";
  byId("bizState").value= biz.companyState || "";

  byId("invPrefix").value = biz.invoicePrefix || "INV-";
  byId("invNext").value   = biz.invoiceNext || 1;
  byId("invScheme").value = biz.invoiceScheme || "sequential";

  byId("btnSaveBiz").addEventListener("click", () => {
    setSettings({
      companyName: byId("bizName").value.trim(),
      companyRegNo: byId("bizReg").value.trim(),
      companyTaxId: byId("bizTax").value.trim(),
      companyAddress1: byId("bizA1").value.trim(),
      companyAddress2: byId("bizA2").value.trim(),
      companyPostcode: byId("bizPost").value.trim(),
      companyCity: byId("bizCity").value.trim(),
      companyState: byId("bizState").value.trim(),
      invoicePrefix: byId("invPrefix").value.trim() || "INV-",
      invoiceNext: Math.max(1, Number(byId("invNext").value || 1)),
      invoiceScheme: byId("invScheme").value || "sequential"
    });
    rootEl.querySelector("#bizMsg").textContent = "Business settings saved.";
  });
  // Theme selector wiring
  const selTheme = rootEl.querySelector("#selTheme");
  selTheme.value = getTheme();
  selTheme.addEventListener("change", () => {
    setTheme(selTheme.value);
  });

  // Language selector wiring
  const selLang = rootEl.querySelector("#selLang");
  selLang.value = getLocale();
  selLang.addEventListener("change", () => setLocale(selLang.value));

  // Motion selector wiring
  const selMotion = rootEl.querySelector("#selMotion");
  selMotion.value = getMotionPref();
  selMotion.addEventListener("change", () => setMotionPref(selMotion.value));

  // Currency, Date Style, Time Style wiring
  const prefs = getSettings();
  const selCurrency = rootEl.querySelector("#selCurrency");
  const selDateStyle = rootEl.querySelector("#selDateStyle");
  const selTimeStyle = rootEl.querySelector("#selTimeStyle");
  selCurrency.value = prefs.currency || "MYR";
  selDateStyle.value = prefs.dateStyle || "medium";
  selTimeStyle.value = prefs.timeStyle || "short";

  function saveAndRefresh(patch) {
    setSettings(patch);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  selCurrency.addEventListener("change", () => saveAndRefresh({ currency: selCurrency.value }));
  selDateStyle.addEventListener("change", () => saveAndRefresh({ dateStyle: selDateStyle.value }));
  selTimeStyle.addEventListener("change", () => saveAndRefresh({ timeStyle: selTimeStyle.value }));
  // --- Theme toggle logic ---
  function applyTheme(theme) {
    const root = document.documentElement;
    if (!theme || theme === "system") {
      root.setAttribute("data-theme", "system");
      // Listen for system changes
      if (!window.__themeListener) {
        window.__themeListener = (e) => {
          if ((getSettings().theme || "system") === "system") {
            root.setAttribute("data-theme", e.matches ? "dark" : "light");
          }
        };
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", window.__themeListener);
      }
      // Set initial system theme
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.setAttribute("data-theme", isDark ? "dark" : "light");
    } else {
      root.setAttribute("data-theme", theme);
    }
  }

  // On load, apply theme
  applyTheme(s.theme);

  // Theme radio listeners
  ["themeLight", "themeDark", "themeSystem"].forEach(id => {
    const el = rootEl.querySelector(`#${id}`);
    if (el) {
      el.addEventListener("change", (e) => {
        if (el.checked) {
          const val = el.value;
          setSettings({ theme: val });
          applyTheme(val);
        }
      });
    }
  });

  const msg = rootEl.querySelector("#msg");
  const authStatus = rootEl.querySelector("#authStatus");
  const chkReq = rootEl.querySelector("#chkRequire");
  const chkLegacy = rootEl.querySelector("#chkLegacy");
  const chkAdminShort = rootEl.querySelector("#chkAdminShort");
  chkAdminShort.addEventListener("change", () => {
    setSettings({ requireAdminForShortLinks: chkAdminShort.checked });
    msg.textContent = "Short-link policy updated.";
  });

  chkReq.addEventListener("change", () => {
    setSettings({ requireVerifiedTokens: chkReq.checked });
    if (chkReq.checked) { chkLegacy.checked = false; chkLegacy.disabled = true; setSettings({ allowLegacyFallback: false }); }
    else { chkLegacy.disabled = false; }
    msg.textContent = "Security settings updated.";
  });

  chkLegacy.addEventListener("change", () => {
    setSettings({ allowLegacyFallback: chkLegacy.checked });
    msg.textContent = "Legacy fallback updated.";
  });

  rootEl.querySelector("#btnSetPin").addEventListener("click", async () => {
    const val = rootEl.querySelector("#pinNew").value.trim();
    if (!val) { msg.textContent = "Enter a new PIN first."; return; }
    await setAdminPin(val);
    msg.textContent = "Admin PIN updated.";
  });

  rootEl.querySelector("#btnClearSession").addEventListener("click", () => {
    setAdminAuthed(false);
    authStatus.textContent = "Locked";
    msg.textContent = "Admin session locked.";
  });

  rootEl.querySelector("#btnLogin").addEventListener("click", async () => {
    const pin = rootEl.querySelector("#pinLogin").value.trim();
    if (!pin) { msg.textContent = "Enter PIN."; return; }
    const ok = await verifyPin(pin);
    if (ok) { setAdminAuthed(true); authStatus.textContent = "Authenticated"; msg.textContent = "Unlocked."; }
    else { msg.textContent = "Invalid PIN."; }
  });

  // --- Sync & Analytics Section ---
  const syncSection = document.createElement("section");
  syncSection.style = "border:1px solid var(--border); border-radius:12px; padding:12px; display:grid; gap:10px; margin-top:12px";
  syncSection.innerHTML = `
    <div style="font-weight:800">Sync & Analytics</div>

    <label class="helper">Endpoint URL</label>
    <input id="anUrl" class="input" placeholder="https://example.com/collect" />

    <label class="helper">Bearer token (optional)</label>
    <input id="anTok" class="input" placeholder="XYZ..." />

    <label style="display:flex; align-items:center; gap:8px"><input type="checkbox" id="bgSyncEnable"/> <span>Enable Background Sync (when online)</span></label>

    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap">
      <label style="display:flex; align-items:center; gap:8px">
        <input type="checkbox" id="bgPeriodic"/> <span>Periodic Sync</span>
      </label>
      <label>Every <input id="bgPeriod" type="number" min="15" class="input" style="width:100px" /> minutes</label>
    </div>

    <div class="helper" style="margin-top:8px">Batch & Retry</div>
    <label style="display:flex; align-items:center; gap:8px">
      <input type="checkbox" id="anBatched"/> <span>Send in batches</span>
    </label>
    <label>Batch size <input id="anBatchSize" type="number" min="1" max="100" class="input" style="width:100px"/></label>
    <div style="display:flex; gap:8px; flex-wrap:wrap">
      <label>Backoff base (ms) <input id="anBackBase" type="number" class="input" style="width:120px"/></label>
      <label>Backoff max (ms) <input id="anBackMax" type="number" class="input" style="width:120px"/></label>
      <label>Jitter (0..1) <input id="anJitter" type="number" step="0.05" min="0" max="1" class="input" style="width:100px"/></label>
    </div>

    <div class="helper" style="margin-top:8px">Transport</div>
    <label>Format
      <select id="anTransport" class="select" style="padding:6px 10px">
        <option value="json">JSON (default)</option>
        <option value="ndjson">NDJSON (newline-delimited)</option>
      </select>
    </label>

    <div class="helper" style="margin-top:8px">Event kind filters</div>
    <label class="helper">Allowlist (if set, only these kinds are sent)</label>
    <input id="kindAllow" class="input" placeholder="order_status, invoice_issued" />
    <label class="helper">Denylist (these kinds are dropped)</label>
    <input id="kindDeny" class="input" placeholder="test_event" />
    <a class="btn" href="#/analytics">Open Analytics Log</a>

    <div class="helper" style="margin-top:8px">Privacy Filter</div>
    <label>Mode
      <select id="anPrivMode" class="select" style="padding:6px 10px">
        <option value="none">None</option>
        <option value="strip_pii">Strip PII (default)</option>
        <option value="allowlist">Allowlist</option>
        <option value="denylist">Denylist</option>
      </select>
    </label>
    <label class="helper">Allowlist (comma-separated keys)</label>
    <textarea id="anAllow" class="input" rows="2" placeholder="invoiceNo,orderId,status,total"></textarea>
    <label class="helper">Denylist (comma-separated keys)</label>
    <textarea id="anDeny" class="input" rows="2" placeholder="name,phone,email,address,address1,address2,postcode,city,state,tax,token,promoCode"></textarea>

    <div class="helper" style="margin-top:8px">Sampling</div>
    <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap">
      <label style="display:flex; align-items:center; gap:6px">
        Default rate:
        <input id="sampRange" type="range" min="0" max="100" step="1" style="width:180px" />
        <input id="sampNum" type="number" min="0" max="100" step="1" class="input" style="width:80px" />%
      </label>
    </div>
    <label class="helper">Per-kind overrides (one per line: <code>kind=percent</code>)</label>
    <textarea id="sampRules" class="input" rows="3" placeholder="order_status=100\norder_eta_bucket=10\ntest_event=0"></textarea>

    <div style="display:flex; gap:8px; flex-wrap:wrap">
      <button id="btnSaveSync" class="btn primary">Save</button>
      <button id="btnSyncNow" class="btn">Sync Now</button>
      <button id="btnSendTest" class="btn">Send Test Event</button>
    </div>

    <div id="syncMsg" class="helper"></div>
  `;
  rootEl.querySelector(".card").appendChild(syncSection);

  function wireSyncSection() {
      // Sampling controls wiring
      $("sampRange").value = Math.round((st.analyticsSamplingDefault ?? 1) * 100);
      $("sampNum").value   = Math.round((st.analyticsSamplingDefault ?? 1) * 100);
      $("sampRange").addEventListener("input", ()=> $("sampNum").value = $("sampRange").value);
      $("sampNum").addEventListener("input", ()=> $("sampRange").value = $("sampNum").value);
      const rulesToText = (obj={}) => Object.entries(obj).map(([k,v]) => `${k}=${Math.round(Number(v||0)*100)}`).join("\n");
      const textToRules = (txt) => {
        const out = {};
        (txt||"").split("\n").forEach(line=>{
          const m = line.trim().match(/^([^=\s]+)\s*=\s*([0-9]+)$/);
          if (m) out[m[1]] = Math.max(0, Math.min(100, Number(m[2])))/100;
        });
        return out;
      };
      $("sampRules").value = rulesToText(st.analyticsSamplingRules || {});
    import("../utils/sync.js").then(({ flushOutboxOnce, registerPeriodicSync }) => {
      const st = getSettings();
      const $ = (id) => rootEl.querySelector("#"+id);
  $("anUrl").value = st.analyticsEndpoint || "";
  $("anTok").value = st.analyticsToken || "";
  $("bgSyncEnable").checked = !!st.bgSyncEnabled;
  $("bgPeriodic").checked = !!st.bgSyncPeriodic;
  $("bgPeriod").value = st.bgSyncPeriodMins || 60;
  $("anBatched").checked = !!st.analyticsBatched;
  $("anBatchSize").value = st.analyticsBatchSize ?? 25;
  $("anBackBase").value = st.analyticsBackoffBaseMs ?? 3000;
  $("anBackMax").value  = st.analyticsBackoffMaxMs  ?? 300000;
  $("anJitter").value   = st.analyticsBackoffJitter ?? 0.25;
  $("anPrivMode").value = st.analyticsPrivacyMode || "strip_pii";
  $("anAllow").value    = (st.analyticsAllowlist || []).join(", ");
  $("anDeny").value     = (st.analyticsDenylist  || []).join(", ");
  // New analytics transport and kind filters
  $("anTransport").value = st.analyticsTransport || "json";
  $("kindAllow").value   = (st.analyticsKindAllow || []).join(", ");
  $("kindDeny").value    = (st.analyticsKindDeny  || []).join(", ");

      $("btnSaveSync").addEventListener("click", async () => {
        setSettings({
          analyticsEndpoint: $("anUrl").value.trim(),
          analyticsToken: $("anTok").value.trim(),
          bgSyncEnabled: $("bgSyncEnable").checked,
          bgSyncPeriodic: $("bgPeriodic").checked,
          bgSyncPeriodMins: Math.max(15, Number($("bgPeriod").value || 60)),
          analyticsBatched: $("anBatched").checked,
          analyticsBatchSize: Math.max(1, Math.min(100, Number($("anBatchSize").value || 25))),
          analyticsBackoffBaseMs: Math.max(100, Number($("anBackBase").value || 3000)),
          analyticsBackoffMaxMs: Math.max(1000, Number($("anBackMax").value || 300000)),
          analyticsBackoffJitter: Math.max(0, Math.min(1, Number($("anJitter").value || 0.25))),
          analyticsPrivacyMode: $("anPrivMode").value,
          analyticsAllowlist: $("anAllow").value.split(",").map(s=>s.trim()).filter(Boolean),
          analyticsDenylist: $("anDeny").value.split(",").map(s=>s.trim()).filter(Boolean),
          // New analytics transport and kind filters
          analyticsTransport: $("anTransport").value,
          analyticsKindAllow: $("kindAllow").value.split(",").map(s=>s.trim()).filter(Boolean),
          analyticsKindDeny:  $("kindDeny").value.split(",").map(s=>s.trim()).filter(Boolean),
          // Sampling controls
          analyticsSamplingDefault: Math.max(0, Math.min(1, Number($("sampNum").value)/100)),
          analyticsSamplingRules: textToRules($("sampRules").value),
        });
        $("syncMsg").textContent = "Sampling settings saved.";
        await registerPeriodicSync();
      });

      $("btnSyncNow").addEventListener("click", async () => {
        const res = await flushOutboxOnce();
        $("syncMsg").textContent = res.ok ? `Synced ${res.sent || 0} event(s).` : (res.reason || "Sync failed");
      });

      $("btnSendTest").addEventListener("click", async () => {
        const { enqueueEvent, flushOutboxOnce } = await import("../utils/sync.js");
        await enqueueEvent("test_event", { hello: "world", email: "user@example.com" });
        const res = await flushOutboxOnce();
        $("syncMsg").textContent = res.ok ? `Synced ${res.sent||0} event(s).` : (res.reason || "Failed");
      });
    }).catch(() => {
      rootEl.querySelector("#syncMsg").textContent = "Sync logic unavailable.";
    });
  }
  setTimeout(wireSyncSection, 0);

  // --- Backup & Restore section wiring ---
  const $ = (id) => rootEl.querySelector("#"+id);
  const bkMsg = $("bkMsg");

  if ($("btnBackup")) {
    $("btnBackup").addEventListener("click", async () => {
      try {
        const bytesPack = await exportBackup(
          {
            includeLocal: $("bkLocal").checked,
            includeInvoices: $("bkInvoices").checked,
            includeShortLinks: $("bkShort").checked,
            includeAnalytics: $("bkAnalytics").checked,
          },
          {
            encrypt: $("bkEncrypt").checked,
            passphrase: $("bkPass").value.trim(),
          }
        );
        downloadBytes(bytesPack);
        bkMsg.textContent = "Backup downloaded.";
      } catch (e) {
        bkMsg.textContent = "Backup failed: " + (e?.message || e);
      }
    });
  }

  if ($("btnRestore")) {
    $("btnRestore").addEventListener("click", async () => {
      const file = $("restoreFile").files?.[0];
      if (!file) { bkMsg.textContent = "Choose a backup file first."; return; }
      const mode = $("restoreMode").value;
      const pass = $("restorePass").value.trim();

      try {
        const res = await importBackup(file, { passphrase: pass, mode });
        bkMsg.textContent = `Restore ok. Restored: ${res.restored.ls} keys, ${res.restored.outbox} outbox, ${res.restored.logs} logs. Reloading…`;
        setTimeout(()=> location.reload(), 500);
      } catch (e) {
        bkMsg.textContent = "Restore failed: " + (e?.message || e);
      }
    });
  }

  if ($("btnFactoryReset")) {
    $("btnFactoryReset").addEventListener("click", async () => {
      if (!confirm("Factory Reset will remove all app data on this browser. Continue?")) return;
      if (!confirm("Really proceed? This cannot be undone.")) return;
      try { await factoryReset(); } catch {}
      bkMsg.textContent = "All local data cleared. Reloading…";
      setTimeout(()=> location.reload(), 400);
    });
  }

  return () => {};
  // --- Backup & Restore section UI ---
  rootEl.querySelector(".card").insertAdjacentHTML("beforeend", `
<section id="section-backup" style="border:1px solid var(--border); border-radius:12px; padding:12px; display:grid; gap:10px; margin-top:12px">
  // Feature Flags wiring
  const $ = (id) => rootEl.querySelector("#"+id);
  const flags = getFlags();
  $("ffCore").checked = !!flags.coreMode;
  $("ffPwa").checked = !!flags.pwa;
  $("ffNotif").checked = !!flags.notifications;
  $("ffAnalytics").checked = !!flags.analytics;
  $("ffBackup").checked = !!flags.backup;
  $("ffKds").checked = !!flags.kds;

  $("btnFlagsSave").addEventListener("click", () => {
    setFlags({
      coreMode: $("ffCore").checked,
      pwa: $("ffPwa").checked,
      notifications: $("ffNotif").checked,
      analytics: $("ffAnalytics").checked,
      backup: $("ffBackup").checked,
      kds: $("ffKds").checked,
    });
    $("flagsMsg").textContent = "Saved. Reload recommended.";
    applyFlagVisibility();
  });

  $("btnFlagsMinimal").addEventListener("click", () => {
    setFlags({ coreMode: true });
    $("ffCore").checked = true;
    ["ffPwa","ffNotif","ffAnalytics","ffBackup","ffKds"].forEach(id => { $(id).checked = false; });
    $("flagsMsg").textContent = "Core Mode enabled. Reload recommended.";
    applyFlagVisibility();
  });

  function show(id, on) { const el = rootEl.querySelector("#"+id); if (el) el.style.display = on ? "" : "none"; }
  function applyFlagVisibility() {
    const f = getFlags();
    show("section-sync",      f.analytics);
    show("section-backup",    f.backup);
    show("section-notify",    f.notifications);
    // If you want to show/hide KDS UI blocks, add here
  }
  applyFlagVisibility();

  $("btnFlagsSave").addEventListener("click", () => {
    setFlags({
      coreMode: $("ffCore").checked,
      pwa: $("ffPwa").checked,
      notifications: $("ffNotif").checked,
      analytics: $("ffAnalytics").checked,
      backup: $("ffBackup").checked,
    });
    $("flagsMsg").textContent = "Saved. Reload recommended.";
    applyFlagVisibility();
  });

  $("btnFlagsMinimal").addEventListener("click", () => {
    setFlags({ coreMode: true });
    $("ffCore").checked = true;
    ["ffPwa","ffNotif","ffAnalytics","ffBackup"].forEach(id => { $(id).checked = false; });
    $("flagsMsg").textContent = "Core Mode enabled. Reload recommended.";
    applyFlagVisibility();
  });

  function show(id, on) { const el = rootEl.querySelector("#"+id); if (el) el.style.display = on ? "" : "none"; }
  function applyFlagVisibility() {
    const f = getFlags();
    show("section-sync",      f.analytics);
    show("section-backup",    f.backup);
    show("section-notify",    f.notifications);
  }
  applyFlagVisibility();
  <div style="font-weight:800">Backup & Restore</div>

  <div style="display:flex; gap:12px; flex-wrap:wrap">
    <label style="display:flex; align-items:center; gap:6px">
      <input type="checkbox" id="bkLocal" checked/> <span>Local settings & state</span>
    </label>
    <label style="display:flex; align-items:center; gap:6px">
      <input type="checkbox" id="bkInvoices" checked/> <span>Invoices</span>
    </label>
    <label style="display:flex; align-items:center; gap:6px">
      <input type="checkbox" id="bkShort" checked/> <span>Short links</span>
    </label>
    <label style="display:flex; align-items:center; gap:6px">
      <input type="checkbox" id="bkAnalytics" checked/> <span>Analytics (outbox & logs)</span>
    </label>
  </div>

  <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center">
    <label style="display:flex; align-items:center; gap:6px">
      <input type="checkbox" id="bkEncrypt"/> <span>Encrypt with passphrase</span>
    </label>
    <input id="bkPass" class="input" type="password" placeholder="Passphrase" style="width:240px"/>
    <button id="btnBackup" class="btn primary">Download Backup</button>
  </div>

  <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center">
    <select id="restoreMode" class="select">
      <option value="merge" selected>Merge</option>
      <option value="replace">Replace (wipe, then restore)</option>
    </select>
    <input id="restorePass" class="input" type="password" placeholder="Passphrase (if encrypted)" style="width:240px"/>
    <button id="btnRestore" class="btn">Restore</button>
  </div>

  <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top:4px">
    <button id="btnFactoryReset" class="btn" style="border-color:#ef4444; color:#ef4444">Factory Reset</button>
  </div>

  <div id="bkMsg" class="helper"></div>
</section>
`);
  // Shortcuts & Command Palette wiring
  const pal = CommandPalette();
  rootEl.querySelector("#btnOpenPalette").addEventListener("click", ()=> pal.open());

  // Add Outlet Manager link in a suitable admin/settings section
  // Find a good spot in the admin/settings card or section
  // Example: Add to the admin section after other admin controls
  const adminSection = rootEl.querySelector('.card') || rootEl;
  if (adminSection && !adminSection.querySelector('#outletAdminLink')) {
    const link = document.createElement('a');
    link.className = 'btn';
    link.id = 'outletAdminLink';
    link.href = '#/outlets';
    link.textContent = 'Outlets';
    adminSection.appendChild(link);
  }
  // --- Backup & Restore section wiring ---
  (function wireBackup(rootEl){
    const $ = (id)=> rootEl.querySelector("#"+id);
    const planFromUI = () => {
      const plan = defaultBackupPlan();
      Object.keys(plan).forEach(k => plan[k] = false);
      rootEl.querySelectorAll(".bkCheck").forEach(ch => { if (ch.checked) plan[ch.value] = true; });
      return plan;
    };

    if ( $("btnBackup") ) {
      $("btnBackup").addEventListener("click", async ()=>{
        $("bkMsg").textContent = "Preparing…";
        try {
          const plan = planFromUI();
          const pass = $("bkPass").value || "";
          const { filename, blob } = await exportBackup(plan, { encryptWith: pass });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
          URL.revokeObjectURL(url);
          $("bkMsg").textContent = "Backup downloaded.";
        } catch (e) {
          $("bkMsg").textContent = "Failed to export.";
        }
      });
    }

    if ( $("btnRestore") ) {
      $("btnRestore").addEventListener("click", async ()=>{
        const f = $("bkFile").files?.[0];
        if (!f) { $("rsMsg").textContent = "Choose a backup file."; return; }
        $("rsMsg").textContent = "Importing…";
        try {
          await importBackup(f, { passphrase: $("bkPassImport").value || "" });
          $("rsMsg").textContent = "Imported. Reloading…";
          setTimeout(()=> location.reload(), 600);
        } catch (e) {
          $("rsMsg").textContent = e?.message || "Failed to import.";
        }
      });
    }
  })(rootEl);
}
