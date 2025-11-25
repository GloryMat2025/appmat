import { supabase } from "@/lib/supabase";

export async function adminGetOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function adminUpdateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) throw error;
}

export async function adminSendPush(userId: string, payload: any) {
  const { data, error } = await supabase.functions.invoke("push-order", {
    body: { userId, payload }
  });

  if (error) throw error;
  return data;
}
