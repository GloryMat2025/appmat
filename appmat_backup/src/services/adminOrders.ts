import { supabase } from "@/lib/supabase";

export async function getAllOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles ( full_name )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Map profile name
  return data.map((o) => ({
    ...o,
    user_name: o.profiles?.full_name || null,
  }));
}
import { supabase } from "@/lib/supabase";

export async function getAdminOrderDetail(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (*),
      order_status_history (*),
      profiles ( full_name )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  return {
    ...data,
    user_name: data.profiles?.full_name ?? null,
  };
}

export async function updateOrderStatus(orderId: string, status: string) {
  // Update order status
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) throw error;

  // Insert to status history
  await supabase.from("order_status_history").insert({
    order_id: orderId,
    status,
  });

  // Optionally call serverless push notification function
  await fetch(`${import.meta.env.VITE_PUSH_ENDPOINT}/order-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: orderId }),
  });

  return { success: true };
}
