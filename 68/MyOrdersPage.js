import { orderStore } from "../stores/orderStore.js";

const STATUS_LABELS = {
  received: "Received",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
  failed: "Failed"
};

export function MyOrdersPage(rootEl) {
  const orders = orderStore.listOrders();
  rootEl.innerHTML = `
    <div class="card">
      <h2 class="title">My Orders</h2>
      <div style="display:grid; gap:12px; margin-top:16px">
        ${orders.length === 0 ? `<div class='helper'>No orders yet.</div>` : orders.map(order => `
          <div class="order-row" style="display:flex; align-items:center; justify-content:space-between; border:1px solid #eef2f7; border-radius:10px; padding:12px 16px; cursor:pointer" data-id="${order.id}">
            <div>
              <div style="font-weight:700">Order #${order.id}</div>
              <div class="helper">${new Date(order.timestamps.received).toLocaleString()}</div>
            </div>
            <span class="badge" style="padding:4px 10px; border-radius:8px; font-size:12px; font-weight:600; background:${badgeColor(order.status)}; color:#fff;">${STATUS_LABELS[order.status] || order.status}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // Click handler to view order detail
  rootEl.querySelectorAll(".order-row").forEach(row => {
    row.addEventListener("click", () => {
      orderStore.setCurrentOrder(row.getAttribute("data-id"));
      location.hash = `#/order/${row.getAttribute("data-id")}`;
    });
  });

  return () => {};
}

function badgeColor(status) {
  switch (status) {
    case "received": return "#64748b";
    case "preparing": return "#f59e42";
    case "ready": return "#22c55e";
    case "completed": return "#0ea5e9";
    case "cancelled": return "#ef4444";
    case "failed": return "#a21caf";
    default: return "#64748b";
  }
}
