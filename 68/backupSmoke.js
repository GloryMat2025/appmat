// src/tests/specs/backupSmoke.js
import { TK } from "../../utils/testkit.js";
import { exportBackup, importBackup, defaultBackupPlan } from "../../utils/backup.js";

TK.test("backup-roundtrip", "Export → clear → import restores LS keys", async ({ A }) => {
  // seed a key
  localStorage.setItem("myapp.promos", JSON.stringify([{code:"SAVE10"}]));
  const plan = defaultBackupPlan(); plan.outbox = false; // keep test simple

  const { blob } = await exportBackup(plan, { encryptWith: "" });
  const text = await blob.text();

  // clear and verify gone
  localStorage.removeItem("myapp.promos");
  A.ok(!localStorage.getItem("myapp.promos"), "promos cleared");

  // import
  await importBackup(text, {});
  const val = JSON.parse(localStorage.getItem("myapp.promos") || "[]");
  A.equal(val[0]?.code, "SAVE10", "promo restored");
});
