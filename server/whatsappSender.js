import fetch from "node-fetch";

const META_URL = `https://graph.facebook.com/${process.env.META_VERSION}/${process.env.META_PHONE_ID}/messages`;

export async function sendWhatsAppText(to, message) {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message },
  };

  const res = await fetch(META_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.META_WA_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("❌ Gagal hantar mesej:", data);
  } else {
    console.log("✅ Mesej berjaya dihantar ke:", to);
  }
}
