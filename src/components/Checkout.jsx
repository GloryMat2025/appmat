import useCart from "../hooks/useCart";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";

export default function Checkout() {
  const handleSubmit = async (e) => {
  e.preventDefault();

  // Simpan order dalam Supabase
  const { error } = await supabase.from("orders").insert([
    {
      name: form.name,
      phone: form.phone,
      address: form.address,
      items: cartItems,
      total: totalPrice,
    },
  ]);

  if (error) {
    console.error(error);
    alert("Ralat menyimpan pesanan: " + error.message);
    return;
  }

  // Format mesej WhatsApp
  const message = `
Assalamualaikum, saya ingin membuat pesanan 👇

👤 Nama: ${form.name}
📞 Telefon: ${form.phone}
🏠 Alamat: ${form.address}

🛍️ Senarai Item:
${cartItems
  .map(
    (item) => `• ${item.title} x${item.quantity} = RM${(
      item.price * item.quantity
    ).toFixed(2)}`
  )
  .join("\n")}

💰 Jumlah: RM ${totalPrice.toFixed(2)}

Terima kasih! 🙏
  `.trim();

  const phone = "60123456789"; // ganti nombor ni dgn nombor bisnes kau
  const whatsappURL = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, "_blank");

  alert("Pesanan berjaya disimpan & dihantar ke WhatsApp ✅");
};

  return (
    <section
      id="checkout"
      className="py-16 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen"
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center text-blue-700 dark:text-yellow-400">
          Checkout Pesanan 🧾
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form pengguna */}
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4"
          >
            <h3 className="text-xl font-semibold mb-2">Maklumat Pengguna</h3>

            <input
              type="text"
              name="name"
              placeholder="Nama penuh"
              value={form.name}
              onChange={handleChange}
              className="w-full p-2 rounded border dark:bg-gray-700"
              required
            />

            <input
              type="tel"
              name="phone"
              placeholder="No. telefon"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-2 rounded border dark:bg-gray-700"
              required
            />

            <textarea
              name="address"
              placeholder="Alamat penghantaran"
              value={form.address}
              onChange={handleChange}
              rows="4"
              className="w-full p-2 rounded border dark:bg-gray-700"
              required
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
            >
              Sahkan Pesanan
            </motion.button>
          </form>

          {/* Ringkasan pesanan */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h3>

            {cartItems.length === 0 ? (
              <p>Tiada item dalam troli.</p>
            ) : (
              <>
                <ul className="space-y-3 mb-4">
                  {cartItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2"
                    >
                      <span>
                        {item.title} × {item.quantity}
                      </span>
                      <span>RM {(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-between font-semibold text-lg">
                  <span>Jumlah Keseluruhan:</span>
                  <span className="text-blue-700 dark:text-yellow-400">
                    RM {totalPrice.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
