// src/tests/specs/scheduleSmoke.js
import { TK } from "../../utils/testkit.js";
import { setScheduleConfig, generateSlots, validateSelectedSlot } from "../../utils/schedule.js";

TK.test("slots-generate", "Produces future slots with lead time", async ({ A }) => {
  setScheduleConfig({ slotMinutes: 15, leadMinutes: 30, hours: { "0":[], "1":[{start:"00:00",end:"23:59"}], "2":[{start:"00:00",end:"23:59"}], "3":[{start:"00:00",end:"23:59"}], "4":[{start:"00:00",end:"23:59"}], "5":[{start:"00:00",end:"23:59"}], "6":[{start:"00:00",end:"23:59"}] } });
  const today = new Date().toISOString().slice(0,10);
  const slots = generateSlots(today, "delivery");
  A.ok(slots.length > 0, "has slots");
  const anyFuture = slots.some(s => !s.disabled && !s.full);
  A.ok(anyFuture, "has available future slots");
});

TK.test("slot-validate", "Rejects too-soon slot", async ({ A }) => {
  const soon = new Date(Date.now() + 5 * 60_000).toISOString(); // 5m
  const v = validateSelectedSlot({ scheduledAt: soon, mode: "pickup" });
  A.ok(!v.ok, "should fail lead time");
});
