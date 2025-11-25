export async function notify(orderId: string, status: string) {
  await fetch("/api/push/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, status })
  });
}
