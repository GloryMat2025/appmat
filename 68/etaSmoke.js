// src/tests/specs/etaSmoke.js
import { TK } from "../../utils/testkit.js";
import { initETA, addMinutes, secondsLeft } from "../../utils/eta.js";

TK.test("eta-counts-down", "ETA decreases over time and reflects in store", async ({ A }) => {
  // create a tiny shim store if your real store isn't available in tests
  const store = window.orderStore || fakeStore();
  // force a short ETA (20s)
  const now = Date.now();
  store.setState({ ...store.getState(), etaStartAt: new Date(now).toISOString(), etaTargetAt: new Date(now + 20_000).toISOString(), status: "preparing" });
  initETA(store);
  const s0 = secondsLeft(store);
  await new Promise(r => setTimeout(r, 1100));
  const s1 = secondsLeft(store);
  A.ok(s1 < s0, "seconds should decrease");
});

TK.test("eta-adjust", "+5 minutes adjustment increases target", async ({ A }) => {
  const store = window.orderStore || fakeStore();
  store.setState({ ...store.getState(), etaStartAt: new Date().toISOString(), etaTargetAt: new Date(Date.now() + 60_000).toISOString(), status: "preparing" });
  const before = secondsLeft(store);
  addMinutes(store, +5);
  const after = secondsLeft(store);
  A.ok(after - before >= 290, "should add ~5 minutes");
});

function fakeStore() {
  let state = { etaMinutes: 1, status: "preparing" };
  const subs = new Set();
  return {
    getState: () => state,
    setState: (s) => { state = s; subs.forEach(f=>f()); },
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); }
  };
}
