import { serve } from "https://deno.land/std/http/server.ts";

function validateSignature(req: Request) {
  const url = new URL(req.url);
  const signature = url.searchParams.get("signature");
  // skip detailed validation for now
  return !!signature;
}

serve(async (req) => {
  if (!validateSignature(req)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const form = await req.formData();
  const bill_id = form.get("id") as string;
  const paid = form.get("paid") === "true";
  const order_id = form.get("reference_1") as string; // custom field
  const amount = form.get("amount") as string;

  if (paid) {
    // Update order
    await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/orders?id=eq.${order_id}`,
      {
        method: "PATCH",
        headers: {
          apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "paid" }),
      }
    );

    // Insert payment record
    await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/order_payments`,
      {
        method: "POST",
        headers: {
          apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id,
          bill_id,
          amount: parseInt(amount),
          paid_at: new Date().toISOString(),
        }),
      }
    );

    // Push Notification
    await fetch(Deno.env.get("PUSH_RELAY_URL")!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "order_paid",
        order_id,
        status: "paid",
      }),
    });
  }

  return new Response("OK");
});
