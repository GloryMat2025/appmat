// src/tests/specs/loyaltySmoke.js
import { TK } from "../../utils/testkit.js";
import { setLoyalty, credit, debit, valueForPoints, pointsForValue, getLoyaltySettings } from "../../utils/loyalty.js";

TK.test("loyalty-credit-debit", "Balance updates", async ({ A }) => {
  setLoyalty({ balance: 0, ledger: [] });
  credit(120, { reason:"test" });
  A.equal(JSON.parse(localStorage.getItem("myapp.loyalty")).balance, 120);
  debit(20, { reason:"use" });
  A.equal(JSON.parse(localStorage.getItem("myapp.loyalty")).balance, 100);
});

TK.test("loyalty-conversions", "points/value round-trip", async ({ A }) => {
  const s = getLoyaltySettings();
  const val = valueForPoints(100, s);
  const back = pointsForValue(val, s);
  A.ok(Math.abs(back - 100) <= 1, "round-trip within 1 point");
});
