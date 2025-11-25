self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};
  console.log("📩 Push diterima:", data);

  const title = data.title || "Pesanan Baru!";
  const options = {
    body: data.body || "Ada tempahan baru masuk.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    data: data.url || "/admin/orders",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Klik notifikasi → buka tab Admin Orders
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
