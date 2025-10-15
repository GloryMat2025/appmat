// src/tests/specs/coreSmoke.js
import { TK } from "../../utils/testkit.js";

TK.test("menu-add-cart", "Menu item adds to cart and totals update", async ({ A }) => {
  const add = window.appAPI?.addToCart || (item => {
    // fallback: try a common store API
    if (window.orderStore?.addToCart) return window.orderStore.addToCart(item);
    throw new Error("addToCart not available");
  });
  const before = (window.orderStore?.getState?.() || {}).cartTotal || 0;
  add({ id: "TEST-ITEM", name: "Test Nasi Lemak", price: 12.5, qty: 1 });
  const after = (window.orderStore?.getState?.() || {}).cartTotal || 0;
  A.near(after - before, 12.5, 1e-6, "Cart total should increase by item price");
});

TK.test("mode-persist", "Switching to Pickup persists across pages", async ({ A }) => {
  // assume a store shape; adjust to your app if needed
  const setMode = window.orderStore?.setMode || (mode => { const s = window.orderStore.getState(); window.orderStore.setState({ ...s, mode }); });
  setMode("pickup");

  // simulate route change
  location.hash = "#/menu";
  await new Promise(r => setTimeout(r, 50));
  location.hash = "#/orders";
  await new Promise(r => setTimeout(r, 50));

  const mode = window.orderStore?.getState?.().mode;
  A.equal(mode, "pickup", "Mode should remain 'pickup'");
});
