// src/tests/specs/analyticsSmoke.js
import { TK } from "../../utils/testkit.js";
import { computeMetrics } from "../../utils/analytics.js";

TK.test("metrics-basic", "Revenue & counts", async ({ A }) => {
  const orders = [
    { id:"A1", mode:"delivery", items:[{name:"N", qty:2, price:10}], discountTotal:2, loyaltyRedeemValue:1, tax:0, deliveryFee:3, serviceFee:0, status:"completed", createdAt:new Date().toISOString() },
    { id:"B2", mode:"pickup", items:[{name:"M", qty:1, price:8}], discountTotal:0, loyaltyRedeemValue:0, tax:0, deliveryFee:0, serviceFee:0, status:"completed", createdAt:new Date().toISOString() },
  ];
  const m = computeMetrics(orders);
  A.equal(m.orders, 2);
  A.equal(m.items, 3);
  // Net: (2*10 -2 -1 +3) + 8 = 28 + 8 = 36
  A.equal(Math.round(m.revenueNet), 36);
});// src/tests/specs/analyticsSmoke.js
import { TK } from "../../utils/testkit.js";

TK.test("analytics-enqueue", "enqueueEvent stores an event in outbox", async ({ A }) => {
  const sync = await import("../../utils/sync.js");
  const db = await import("../../utils/db.js");
  const before = (await db.outboxAll()).length;
  await sync.enqueueEvent("test_event", { hello: "world" });
  const after = (await db.outboxAll()).length;
  A.equal(after, before + 1, "Outbox should have one more record");
});

TK.test("analytics-flush-ok", "flushOutboxOnce sends and clears with 200", async ({ A, withMockFetch }) => {
  const settingsMod = await import("../../utils/settings.js");
  const sync = await import("../../utils/sync.js");
  const db = await import("../../utils/db.js");
  settingsMod.setSettings({ analyticsEndpoint: "https://example.com/collect", analyticsToken: "", analyticsBatched: true });
  await sync.enqueueEvent("test_event", { n: 1 });

  await withMockFetch({
    "https://example.com/collect": { status: 200, body: { ok: true } }
  }, async () => {
    const res = await sync.flushOutboxOnce();
    A.ok(res.ok, "Flush should be ok");
  });

  const left = (await db.outboxAll()).length;
  A.equal(left, 0, "Outbox should be empty after 200 OK");
});

TK.test("analytics-flush-fail", "flushOutboxOnce backs off on 500", async ({ A, withMockFetch }) => {
  const settingsMod = await import("../../utils/settings.js");
  const sync = await import("../../utils/sync.js");
  const db = await import("../../utils/db.js");
  settingsMod.setSettings({ analyticsEndpoint: "https://example.com/collect", analyticsToken: "" });
  await sync.enqueueEvent("test_event", { n: 2 });

  await withMockFetch(async (url) => new Response("nope", { status: 500 }), async () => {
    const res = await sync.flushOutboxOnce();
    A.ok(res.ok, "Runner returns ok (attempted) even if server 500");
  });

  const items = await db.outboxAll();
  A.ok(items.length >= 1, "Item should remain for retry after 500");
});
