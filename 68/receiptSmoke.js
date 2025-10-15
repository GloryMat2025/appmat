// src/tests/specs/receiptSmoke.js
import { TK } from "../../utils/testkit.js";
import { buildReceiptFromOrder, renderReceiptHTML } from "../../utils/receipt.js";

TK.test("receipt-build", "Totals include promos & loyalty", async ({ A }) => {
  const order = {
    id:"T1", items:[{name:"Item", qty:2, price:5}], discountTotal:2, loyaltyRedeemValue:1, deliveryFee:0, serviceFee:0, tax:0
  };
  const rc = buildReceiptFromOrder(order);
  A.equal(rc.subtotal, 10);
  A.equal(rc.promoDisc, 2);
  A.equal(rc.loyaltyDisc, 1);
  A.equal(rc.payTotal, 7);
});

TK.test("receipt-render", "HTML contains key fields", async ({ A }) => {
  const rc = buildReceiptFromOrder({ id:"X", items:[{name:"A", qty:1, price:3}] });
  const html = renderReceiptHTML(rc);
  A.ok(html.includes("#X"), "Has order id");
  A.ok(html.includes("A × 1"), "Has line item");
});
