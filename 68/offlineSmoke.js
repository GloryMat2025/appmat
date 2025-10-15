// src/tests/specs/offlineSmoke.js
import { TK } from "../../utils/testkit.js";
import { obPut, obAll, obDel } from "../../utils/outbox.js";

TK.test("outbox-queue", "enqueue/dequeue items", async ({ A }) => {
  await obPut({ url:"/api/test", method:"POST", body:'{"a":1}', ts:Date.now() });
  const all = await obAll(10);
  A.ok(all.length >= 1, "queued at least one");
  await obDel(all[0].id);
  const left = await obAll(10);
  A.ok(left.length <= all.length - 1, "deleted one");
});
