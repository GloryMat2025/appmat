import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function TopCustomersChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchTopCustomers = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("name, total");

      if (error) {
        console.error("Ralat ambil data pelanggan:", error);
        return;
      }

      // Kumpul jumlah jualan ikut pelanggan
      const grouped = {};
      data.forEach((order) => {
        const name = order.name || "Tidak Dikenali";
        grouped[name] = (grouped[name] || 0) + Number(order.total || 0);
      });

      // Susun ikut jumlah tertinggi
      const sorted = Object.entries(grouped)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // ambil 5 teratas

      setData(sorted);
    };

    fetchTopCustomers();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-xl font-semibold mb-4 text-blue-700 dark:text-yellow-400">
        🏆 Top 5 Pelanggan Paling Aktif
      </h3>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip formatter={(value) => `RM ${value.toFixed(2)}`} />
            <Bar dataKey="total" fill="#f97316" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500 text-center">Tiada data pelanggan.</p>
      )}
    </div>
  );
}
