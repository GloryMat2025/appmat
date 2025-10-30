import { supabase } from "../lib/supabaseClient";
import { sendWhatsAppText } from "../server/whatsappSender";

export async function runWeeklyReminder() {
  const customers = await getTopCustomers();
  for (const cust of customers) {
    const message = createWhatsAppMessage(cust);
    const phone = cust.phone.replace(/^0/, "6");
    await sendWhatsAppText(phone, message);
  }
}


// Fungsi untuk ambil top pelanggan
export async function getTopCustomers(limit = 5) {
  const { data, error } = await supabase.from("orders").select("name, phone, total");

  if (error) {
    console.error("Ralat ambil data pelanggan:", error);
    return [];
  }

  const grouped = {};
  data.forEach((o) => {
    const name = o.name || "Tidak Dikenali";
    const phone = o.phone || "-";
    if (!grouped[name]) grouped[name] = { name, phone, total: 0 };
    grouped[name].total += Number(o.total || 0);
  });

  return Object.values(grouped)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

// Fungsi untuk hasilkan mesej WhatsApp automatik
export function createWhatsAppMessage(cust) {
  return `
Assalamualaikum ${cust.name}! 🌿

Terima kasih kerana terus menyokong *AppMat* 🙏  
Kami hargai kepercayaan anda dan ingin berikan hadiah kecil 🎁

Gunakan kod promo: *SETIA10* untuk diskaun 10% minggu ini 💥

Klik sini untuk terus WhatsApp kami 👇
https://wa.me/60123456789?text=${encodeURIComponent(
    `Hai, saya ${cust.name}. Saya nak guna kod SETIA10 😄`
  )}

Terima kasih & semoga hari anda diberkati 🌸
`.trim();
}

// Jalankan scheduler mingguan
export async function runWeeklyReminder() {
  const customers = await getTopCustomers();
  customers.forEach((cust) => {
    const message = createWhatsAppMessage(cust);
    const phone = cust.phone.replace(/^0/, "6");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  });
}
