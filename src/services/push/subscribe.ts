export async function subscribeToOrder(orderId: string) {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId })
  });

  if (!res.ok) throw new Error("Failed to subscribe to order notifications");
}
