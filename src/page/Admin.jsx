import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

Admin.propTypes = {
  // TODO: define props here (auto added)
};

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, name, phone, address, total, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading orders...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        ❌ Error: {error}
      </div>
    );
  }

  return (
    <section className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-700 dark:text-yellow-400">
        🧾 Senarai Pesanan
      </h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">Tiada pesanan buat masa ini.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-3 text-left">Nama</th>
                <th className="p-3 text-left">Telefon</th>
                <th className="p-3 text-left">Alamat</th>
                <th className="p-3 text-left">Jumlah (RM)</th>
                <th className="p-3 text-left">Tarikh</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="odd:bg-gray-100 dark:odd:bg-gray-800 even:bg-white dark:even:bg-gray-900"
                >
                  <td className="p-3">{o.name}</td>
                  <td className="p-3">{o.phone}</td>
                  <td className="p-3">{o.address}</td>
                  <td className="p-3 font-semibold">{o.total?.toFixed(2)}</td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
