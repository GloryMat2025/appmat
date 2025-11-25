import { supabase } from "@/lib/supabase";

const BILLPLZ_API = import.meta.env.VITE_BILLPLZ_API!;
const BILLPLZ_KEY = import.meta.env.VITE_BILLPLZ_KEY!;
const BILLPLZ_COLLECTION = import.meta.env.VITE_BILLPLZ_COLLECTION!;

export async function createBill(orderId: string, amount: number, email: string, name: string) {
  const res = await fetch(`${BILLPLZ_API}/bills`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(BILLPLZ_KEY + ":")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      collection_id: BILLPLZ_COLLECTION,
      email,
      name,
      amount: amount * 100,
      reference_1_label: "OrderID",
      reference_1: orderId,
      deliver: true
    })
  });

  const json = await res.json();
  return {
    url: json.url,
    bill_id: json.id
  };
}

export async function markOrderPaid(orderId: string) {
  const { error } = await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId);

  if (error) throw error;
}
