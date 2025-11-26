export async function registerDeviceToken(token: string) {
  const res = await fetch("/api/push/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token })
  });

  if (!res.ok) throw new Error("Failed to register device token");
}
