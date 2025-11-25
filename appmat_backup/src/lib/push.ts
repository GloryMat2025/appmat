import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY!;

export async function registerPushSubscription() {
  if (!("serviceWorker" in navigator)) return null;
  if (!("PushManager" in window)) return null;

  const registration = await navigator.serviceWorker.register("/sw.js");

  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  const userId = await getUserIdSafe();

  await supabase.from("subscriptions").upsert({
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: arrayBufferToBase64(sub.getKey("p256dh")),
    auth: arrayBufferToBase64(sub.getKey("auth")),
    created_at: new Date().toISOString()
  });

  return sub;
}

export async function getUserIdSafe() {
  const session = await supabase.auth.getSession();
  return session.data.session?.user?.id || null;
}

export function listenPushMessages(callback: (data: any) => void) {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.addEventListener("message", (event) => {
    callback(event.data);
  });
}

// Helpers
function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null) {
  if (!buffer) return null;
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}
