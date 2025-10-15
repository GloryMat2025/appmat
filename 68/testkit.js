// src/utils/testkit.js
export const TK = (() => {
  const tests = new Map(); // id -> { id, name, fn }
  function test(id, name, fn) {
    if (!id || typeof fn !== "function") throw new Error("test(id,name,fn) required");
    tests.set(id, { id, name, fn });
  }
  function list() { return Array.from(tests.values()); }

  // --- assertions ---
  const A = {
    equal(a, b, msg = "Expected values to be equal") {
      if (a !== b) throw new Error(`${msg}. got=${JSON.stringify(a)} expected=${JSON.stringify(b)}`);
    },
    ok(v, msg = "Expected truthy") {
      if (!v) throw new Error(msg);
    },
    notNull(v, msg = "Expected non-null/undefined") {
      if (v === null || v === undefined) throw new Error(msg);
    },
    near(a, b, eps = 1e-6, msg = "Expected nearly equal") {
      if (Math.abs(Number(a) - Number(b)) > eps) throw new Error(`${msg}. got=${a} expected≈${b}`);
    },
  };

  // --- spy ---
  function spy(fn = ()=>{}) {
    const s = (...args) => { s.calls.push(args); try { return fn(...args); } finally {} };
    s.calls = [];
    s.reset = () => (s.calls = []);
    return s;
  }

  // --- mock fetch (scoped) ---
  async function withMockFetch(mapOrFn, run) {
    const orig = window.fetch;
    window.fetch = async (input, init) => {
      try {
        if (typeof mapOrFn === "function") return await mapOrFn(input, init);
        const url = typeof input === "string" ? input : (input?.url || "");
        if (mapOrFn[url]) {
          const res = mapOrFn[url];
          return new Response(JSON.stringify(res.body ?? {}), { status: res.status ?? 200, headers: { "Content-Type": "application/json" } });
        }
        return new Response("Not mocked", { status: 501 });
      } catch (e) {
        return new Response("Mock error: " + (e?.message || e), { status: 500 });
      }
    };
    try { return await run(); }
    finally { window.fetch = orig; }
  }

  // --- runner ---
  async function run(selectedIds = null, onProgress = ()=>{}) {
    const candidates = selectedIds ? list().filter(t => selectedIds.includes(t.id)) : list();
    const results = [];
    const t0 = Date.now();
    for (const t of candidates) {
      const r = { id: t.id, name: t.name, ok: false, ms: 0, error: null };
      const s0 = performance.now?.() || Date.now();
      try {
        await t.fn({ A, spy, withMockFetch });
        r.ok = true;
      } catch (e) {
        r.error = e?.message || String(e);
      } finally {
        r.ms = (performance.now?.() || Date.now()) - s0;
        results.push(r);
        onProgress(r, results);
      }
    }
    return { total: results.length, passed: results.filter(x=>x.ok).length, failed: results.filter(x=>!x.ok).length, ms: Date.now()-t0, results };
  }

  return { test, list, run };
})();
