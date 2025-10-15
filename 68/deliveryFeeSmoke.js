// src/tests/specs/deliveryFeeSmoke.js
import { TK } from "../../utils/testkit.js";
import { computeDeliveryFee } from "../../utils/deliveryFee.js";

TK.test("fee-tiers", "Selects correct tier by distance", async ({ A }) => {
  const outlet = { lat: 3.139, lng: 101.687 }; // KL
  const address = { lat: 3.15, lng: 101.70 };   // nearby
  const cfg = { freeThreshold: 0, noServiceBeyondKm: 15, tiers: [{maxKm:3, fee:3},{maxKm:6, fee:6}] };
  const res = computeDeliveryFee({ outlet, address, cartTotal: 20, outletZones: cfg });
  A.ok(res.ok, "ok");
  A.equal(res.fee, 3, "first tier fee");
});

TK.test("fee-free", "Free delivery above threshold", async ({ A }) => {
  const outlet = { lat: 3.139, lng: 101.687 };
  const address = { lat: 3.14, lng: 101.69 };
  const cfg = { freeThreshold: 50, noServiceBeyondKm: 10, tiers: [{maxKm:5, fee:5}] };
  const res = computeDeliveryFee({ outlet, address, cartTotal: 60, outletZones: cfg });
  A.equal(res.fee, 0, "free");
});

TK.test("beyond-zone", "Blocks outside cutoff", async ({ A }) => {
  const outlet = { lat: 3.139, lng: 101.687 };
  const far    = { lat: 3.50, lng: 101.90 };
  const cfg = { freeThreshold: 0, noServiceBeyondKm: 5, tiers: [{maxKm:3, fee:3}] };
  const res = computeDeliveryFee({ outlet, address: far, cartTotal: 10, outletZones: cfg });
  A.ok(!res.ok && res.reason === "beyond_zone", "beyond cutoff");
});
