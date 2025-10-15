import { TK } from "../../utils/testkit.js";
import { upsertOutlet } from "../../utils/outlets.js";
import { setOutletSchedule, getOutletSchedule } from "../../utils/schedule.outlet.js";
import { generateSlots } from "../../utils/schedule.js";

TK.test("outlet-overrides", "Outlet schedule overrides global", async ({ A }) => {
  const id = upsertOutlet({ name:"Test Outlet", isPrimary:true });
  setOutletSchedule(id, {
    slotMinutes: 30, leadMinutes: 60,
    hours: { "1":[{start:"12:00",end:"14:00"}] }, // Monday 12–14
    capacity: { pickup: 1, delivery: 1 },
  });
  const monday = nextDowISO(1);
  const slots = generateSlots(monday, "pickup", { outletId: id });
  A.ok(slots.length >= 3, "has 30m slots in 2h window");
  A.ok(slots.every(s => s.cap === 1), "cap is 1");
});

function nextDowISO(dow){ // 0=Sun..6=Sat
  const d = new Date(); const n = d.getDay(); const add = (dow - n + 7) % 7 || 7; // next week if today
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()+add);
  return t.toISOString().slice(0,10);
}
