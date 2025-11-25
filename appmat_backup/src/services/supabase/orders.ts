import { supabase } from "./client";

export async function getOrders(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getOrderDetail(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*)")
    .eq("id", orderId)
    .single();

  if (error) throw error;
  return data;
}
