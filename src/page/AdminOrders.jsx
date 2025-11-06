import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  // 🧠 Muat naik pesanan awal + langgan realtime
  useEffect(() => {
    // Dapatkan data awal
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error("❌ Fetch failed:", error);
      else setOrders(data || []);
    };

    fetchOrders();

    // Langgan perubahan realtime (INSERT)
    const channel = supabase
      .channel("orders_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          console.log("📦 Pesanan baru diterima:", payload.new);
          setOrders((prev) => [payload.new, ...prev]);

          // Optional: Papar notifikasi browser
          if (Notification.permission === "granted") {
            new Notification("🛍️ Pesanan Baru", {
              body: `Jumlah: RM${payload.new.total} | Kaedah: ${payload.new.payment_metl}`,
            });
          }
        }
      )
      .subscribe();

    // Bersihkan langganan bila keluar
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        📦 Senarai Pesanan
      </h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">Tiada pesanan lagi.</p>
      ) : (
        <table className="w-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-2 px-3 text-left">#</th>
              <th className="py-2 px-3 text-left">Jumlah (RM)</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-left">Pembayaran</th>
              <th className="py-2 px-3 text-left">Tarikh</th>
              <th className="py-2 px-3 text-left">Alamat</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr
                key={o.id}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <td className="py-2 px-3">{i + 1}</td>
                <td className="py-2 px-3">{o.total.toFixed(2)}</td>
                <td className="py-2 px-3">{o.status}</td>
                <td className="py-2 px-3">{o.payment_metl}</td>
                <td className="py-2 px-3">
                  {new Date(o.created_at).toLocaleString()}
                </td>
                <td className="py-2 px-3">{o.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
