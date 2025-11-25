import { supabase } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

export async function getOrders(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
export async function getOrderDetail(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (*),
      order_status_history (*)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createOrder(items: any[], userId: string) {
  const res = await fetch("/api/orders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, user_id: userId }),
  });

  return await res.json();
}

export interface OrderItemInput {
  product_id: string;
  qty: number;
}

export async function createOrder(userId: string, items: OrderItemInput[]) {
  const { data, error } = await supabase
    .from("orders")
    .insert([
      {
        user_id: userId,
        status: "pending",
        items
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

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
    .select(
      `
      *,
      order_items(*),
      order_status_history(*)
    `
    )
    .eq("id", orderId)
    .single();

  if (error) throw error;
  return data;
}

export async function addOrderStatus(orderId: string, status: string) {
  const { data, error } = await supabase
    .from("order_status_history")
    .insert([
      {
        order_id: orderId,
        status
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
