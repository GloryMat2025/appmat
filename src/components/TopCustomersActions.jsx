import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';

export default function TopCustomersActions() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopCustomers = async () => {
      const { data, error } = await supabase.from('orders').select('name, phone, total');

      if (error) {
        console.error('Ralat ambil data pelanggan:', error);
        return;
      }

      // Kumpul jualan ikut pelanggan
      const grouped = {};
      data.forEach((order) => {
        const name = order.name || 'Tidak Dikenali';
        const phone = order.phone || '-';
        if (!grouped[name]) grouped[name] = { name, phone, total: 0 };
        grouped[name].total += Number(order.total || 0);
      });

      const sorted = Object.values(grouped)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setCustomers(sorted);
      setLoading(false);
    };

    fetchTopCustomers();
  }, []);

  const sendWhatsApp = (cust) => {
    const message = `
Assalamualaikum ${cust.name}! 🌸

Terima kasih kerana sering membuat pesanan di *AppMat* 🙏  
Kami amat menghargai sokongan anda 💖  

Sebagai pelanggan istimewa, kami ingin menawarkan:
🎁 *Diskaun khas 10%* untuk pesanan seterusnya!

Klik sini untuk hubungi kami 👇
https://wa.me/60123456789?text=${encodeURIComponent(
      `Hai, saya ${cust.name}. Saya nak guna diskaun pelanggan setia 😊`
    )}

Terima kasih & semoga terus sihat selalu!
`.trim();

    const url = `https://wa.me/${cust.phone.replace(/^0/, '6')}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-xl font-semibold mb-4 text-blue-700 dark:text-yellow-400">
        💬 Hantar Ucapan / Promosi ke Pelanggan Aktif
      </h3>

      {loading ? (
        <p className="text-gray-500">Memuat data pelanggan...</p>
      ) : customers.length === 0 ? (
        <p className="text-gray-500">Tiada pelanggan ditemui.</p>
      ) : (
        <div className="space-y-4">
          {customers.map((cust, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2"
            >
              <div>
                <p className="font-semibold text-lg">{cust.name}</p>
                <p className="text-sm text-gray-500">
                  📞 {cust.phone} — RM {cust.total.toFixed(2)}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={runWeeklyReminder}
                className="bg-blue-600 text-white px-6 py-2 rounded mt-4 hover:bg-blue-700 transition"
              >
                🚀 Jalankan Reminder Mingguan Sekarang
              </motion.button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
