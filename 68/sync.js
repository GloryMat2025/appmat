import { outboxAdd, outboxAll, outboxRemove, outboxUpdate, logAdd } from "./db.js";
import { getSettings } from "./settings.js";
import { isEnabled } from "./flags.js";

const SYNC_TAG = "myapp-sync";
const PSYNC_TAG = "myapp-periodic";

export async function enqueueEvent(kind, payload) {
  if (!isEnabled("analytics")) return { ok: false, reason: "analytics disabled" };

  // --- sampling: decide before storing ---

  if (!shouldKeep(kind)) {
    try { await logAdd({ type: "sampled_drop", msg: `Dropped by sampling: ${kind}`, meta: { kind } }); } catch {}
    return;
  }

  const rec = { kind, payload, createdAt: Date.now() };
  try { await outboxAdd(rec); await logAdd({ type: "queue", msg: `Queued ${kind}`, meta: { kind } }); } catch {}

  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready;
    if (getSettings().bgSyncEnabled && "sync" in reg) {
      try { await reg.sync.register(SYNC_TAG); } catch {}
    }
  }
}
// Sampling helper
function shouldKeep(kind) {
  const s = getSettings();
  const rules = s.analyticsSamplingRules || {};
  const def = Number(s.analyticsSamplingDefault ?? 1);
  const rate = typeof rules[kind] === "number" ? rules[kind] : def;
  const r = Math.max(0, Math.min(1, Number(rate)));
  return Math.random() < r;
}

export async function flushOutboxOnce() {
  if (!isEnabled("analytics")) return { ok: false, reason: "analytics disabled" };

  const s = getSettings();
  const url = (s.analyticsEndpoint || "").trim();
  const token = (s.analyticsToken || "").trim();
  if (!url) return { ok: false, reason: "No endpoint configured" };

  const all = await outboxAll();
  const now = Date.now();
  const due = all.filter(it => (it.nextAttemptAt || 0) <= now);

  // Drop filtered kinds upfront (log + remove)
  const { kept, dropped } = filterKinds(due, s);
  for (const it of dropped) {
    await outboxRemove(it.id);
  }
  if (dropped.length) {
  await logAdd({ type:"filter", msg:`Dropped ${dropped.length} filtered event(s)`, meta:{ dropped: dropped.map(x=>x.kind) } });
  }
  if (!kept.length) {
    await logAdd({ type:"flush", msg:"Nothing to send (empty or filtered)", meta:{} });
    return { ok: true, sent: 0 };
  }

  const batchSize = clamp(Number(s.analyticsBatchSize || 25), 1, 100);
  const batched   = !!s.analyticsBatched;
  const transport = (s.analyticsTransport || "json");

  let sent = 0;
  for (let i = 0; i < kept.length; i += batchSize) {
    const chunk = kept.slice(i, i + batchSize);

    const payload = batched ? buildBatch(chunk, s) : buildUnbatched(chunk, s);
    const { body, headers } = encodeTransport(payload, transport, s);

    try {
      const t0 = performance.now?.() || Date.now();
      const res = await fetch(url, {
        method: "POST",
  headers: Object.assign({}, token ? { "Authorization": `Bearer ${token}` } : {}, headers),
        body
      });
      const t1 = performance.now?.() || Date.now();

      if (res.ok) {
        for (const it of chunk) { await outboxRemove(it.id); sent++; }
  await logAdd({ type:"flush_ok", msg:`Sent ${chunk.length} event(s)`, meta:{ status: res.status, ms: Math.round(t1-t0), transport, count: chunk.length } });
      } else {
        await markFailed(chunk, s);
  await logAdd({ type:"flush_fail", msg:`Server ${res.status}` , meta:{ status: res.status, transport, count: chunk.length } });
        break;
      }
    } catch (e) {
      await markFailed(chunk, s);
      await logAdd({ type:"flush_err", msg:"Network error", meta:{ transport, count: chunk.length } });
      break;
    }
  }

  return { ok: true, sent };
}

/* ---------- helpers ---------- */

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function filterKinds(items, settings) {
  const allow = (settings.analyticsKindAllow || []);
  const deny  = (settings.analyticsKindDeny  || []);

  // If allowlist has entries, only those pass
  const kept = [];
  const dropped = [];
  for (const it of items) {
    const kind = it.kind;
    if (allow.length && !allow.includes(kind)) { dropped.push(it); continue; }
    if (deny.length && deny.includes(kind))    { dropped.push(it); continue; }
    kept.push(it);
  }
  return { kept, dropped };
}

// Batch/unbatched payload (same shape; server can ignore 'mode')
function buildBatch(items, settings) {
  return {
    app: "myapp",
    mode: "batch",
    count: items.length,
    events: items.map(it => ({
      id: it.id, type: it.kind, ts: it.createdAt,
      payload: sanitize(it.kind, it.payload, settings)
    })),
  };
}
function buildUnbatched(items, settings) {
  return {
    app: "myapp",
    mode: "single",
    count: items.length,
    events: items.map(it => ({
      id: it.id, type: it.kind, ts: it.createdAt,
      payload: sanitize(it.kind, it.payload, settings)
    })),
  };
}

// Transport encoder: JSON vs NDJSON
function encodeTransport(obj, transport, settings) {
  if (transport === "ndjson") {
    const lines = (obj.events || []).map(e => JSON.stringify({ app: obj.app, type: e.type, ts: e.ts, payload: e.payload }));
    return { body: lines.join("\n") + "\n", headers: { "Content-Type": "application/x-ndjson" } };
  }
  return { body: JSON.stringify(obj), headers: { "Content-Type": "application/json" } };
}

// privacy filtering (same as before)
function sanitize(kind, obj, settings) {
  const mode = settings.analyticsPrivacyMode || "none";
  if (mode === "none") return obj;

  const ALLOW = new Set((settings.analyticsAllowlist || []).map(String));
  const DENY  = new Set((settings.analyticsDenylist  || []).map(String));
  const DEFAULT_DENY = new Set(["name","phone","email","address","address1","address2","postcode","city","state","tax","taxId","reg","token","promoCode"]);

  function walk(v) {
    if (v === null || typeof v !== "object") return v;
    if (Array.isArray(v)) return v.map(walk);
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (mode === "allowlist") { if (!ALLOW.has(k)) continue; }
      else if (mode === "denylist") { if (DENY.has(k)) continue; }
      else if (mode === "strip_pii") { if (DEFAULT_DENY.has(k) || DENY.has(k)) continue; }
      out[k] = walk(val);
    }
    return out;
  }

  return walk(obj);
}

async function markFailed(items, s) {
  const base = Number(s.analyticsBackoffBaseMs || 3000);
  const max  = Number(s.analyticsBackoffMaxMs  || 300000);
  const jit  = Number(s.analyticsBackoffJitter || 0.25);
  const updates = items.map(async it => {
    const tries = Number(it.retryCount || 0) + 1;
    const exp   = Math.min(max, base * Math.pow(2, tries - 1));
    const jitter= 1 + (Math.random() * 2 - 1) * jit;
    const delay = Math.round(exp * jitter);
    const next  = Date.now() + delay;
    await outboxUpdate({ ...it, retryCount: tries, nextAttemptAt: next });
  });
  await Promise.all(updates);
  await logAdd({ type:"backoff", msg:`Backoff scheduled for ${items.length} item(s)`, meta:{ count: items.length } });
}
