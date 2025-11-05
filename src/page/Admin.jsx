import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';
import SalesChart from '../components/SalesChart';
import MonthlySalesChart from '../components/MonthlySalesChart';
import TopCustomersChart from '../components/TopCustomersChart';
import TopCustomersActions from '../components/TopCustomersActions';
import { useEffect } from 'react';
import { runWeeklyReminder } from '../utils/weeklyReminder';

useEffect(() => {
  const now = new Date();
  const day = now.getDay(); // 5 = Jumaat
  const hour = now.getHours();

  // Jalankan automatik bila hari Jumaat jam 5 petang
  if (day === 5 && hour === 17) {
    runWeeklyReminder();
  }
}, []);

{
  /* Jadual pesanan */
}
<div className="mt-10">
  <SalesChart />
  <MonthlySalesChart />
  <TopCustomersChart />
  <TopCustomersActions />
</div>;

// Bunyi notifikasi
const playSound = () => {
  const audio = new Audio('/sounds/notification.mp3'); // letak dalam public/sounds/
  audio.play().catch(() => {}); // elak error bila autoplay disekat
};

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [newOrder, setNewOrder] = useState(null); // untuk popup banner

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setOrders(data);
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
  };

  // Realtime listener
  const subscribeToOrders = () => {
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        playSound();
        setNewOrder(payload.new);
        setOrders((prev) => [payload.new, ...prev]);
        setTimeout(() => setNewOrder(null), 7000); // popup hilang lepas 7s
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? payload.new : o)));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  };

  useEffect(() => {
    fetchOrders();
    const cleanup = subscribeToOrders();
    return cleanup;
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch =
        order.name?.toLowerCase().includes(search.toLowerCase()) || order.phone?.includes(search);
      const matchStatus = filterStatus === 'semua' ? true : order.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, search, filterStatus]);

  const today = new Date().toISOString().slice(0, 10);
  const totalHarian = useMemo(() => {
    const hariIni = orders.filter((o) => o.created_at?.startsWith(today));
    return hariIni.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [orders]);

  const statusColor = {
    baru: 'bg-yellow-400 text-black',
    diproses: 'bg-blue-500 text-white',
    selesai: 'bg-green-500 text-white',
  };

  const nextStatus = (current) =>
    current === 'baru' ? 'diproses' : current === 'diproses' ? 'selesai' : 'baru';

  return (
    <section className="py-12 px-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto relative">
        <h2 className="text-3xl font-bold text-center text-blue-700 dark:text-yellow-400 mb-8">
          Dashboard Pesanan ⚡ (Realtime + Notifikasi)
        </h2>

        {/* Popup Notifikasi */}
        {newOrder && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg z-50"
          >
            <h3 className="font-bold text-lg">Pesanan Baru Diterima 🎉</h3>
            <p>
              {newOrder.name} — RM {Number(newOrder.total).toFixed(2)}
            </p>
          </motion.div>
        )}

        {/* Bar carian & filter */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <input
            type="text"
            placeholder="Cari nama / no. telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 p-2 rounded border dark:bg-gray-700"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-1/4 p-2 rounded border dark:bg-gray-700"
          >
            <option value="semua">Semua Status</option>
            <option value="baru">Baru</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>

        {/* Statistik mini */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-100 p-4 rounded shadow">
            <h3 className="font-semibold text-yellow-700">Baru</h3>
            <p className="text-2xl font-bold">{orders.filter((o) => o.status === 'baru').length}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded shadow">
            <h3 className="font-semibold text-blue-700">Diproses</h3>
            <p className="text-2xl font-bold">
              {orders.filter((o) => o.status === 'diproses').length}
            </p>
          </div>
          <div className="bg-green-100 p-4 rounded shadow">
            <h3 className="font-semibold text-green-700">Selesai</h3>
            <p className="text-2xl font-bold">
              {orders.filter((o) => o.status === 'selesai').length}
            </p>
          </div>
        </div>

        {/* Jumlah harian */}
        <div className="text-right mb-4 text-lg font-semibold text-green-600 dark:text-green-400">
          💰 Jualan hari ini: RM {totalHarian.toFixed(2)}
        </div>

        {/* Jadual pesanan */}
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 dark:bg-gray-700 text-white">
                <th className="p-3 text-left">Nama</th>
                <th className="p-3 text-left">Telefon</th>
                <th className="p-3 text-left">Alamat</th>
                <th className="p-3 text-left">Jumlah (RM)</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Tarikh</th>
                <th className="p-3 text-left">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                >
                  <td className="p-3">{order.name}</td>
                  <td className="p-3">{order.phone}</td>
                  <td className="p-3 text-sm">{order.address}</td>
                  <td className="p-3 font-semibold">{Number(order.total).toFixed(2)}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-semibold ${
                        statusColor[order.status || 'baru']
                      }`}
                    >
                      {order.status || 'baru'}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    {new Date(order.created_at).toLocaleString('ms-MY')}
                  </td>
                  <td className="p-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateStatus(order.id, nextStatus(order.status))}
                      className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-400 transition"
                    >
                      Tukar Status
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
