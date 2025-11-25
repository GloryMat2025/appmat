import { supabase } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

export async function saveSubscription(userId: string, token: string) {
  await supabase.from("subscriptions").insert({
    user_id: userId,
    token,
    device: navigator.userAgent,
  });
}

export async function saveSubscription(userId: string, sub: any) {
  const payload = {
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    created_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(payload);

  if (error) throw error;
}

export async function removeSubscription(endpoint: string) {
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) throw error;
}
