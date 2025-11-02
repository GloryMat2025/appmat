import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function SalesChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 6);
      const from = startOfWeek.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("orders")
        .select("total, created_at")
        .gte("created_at", from);

      if (error) return console.error(error);

      // Kumpulkan jualan ikut tarikh
      const grouped = {};
      data.forEach((o) => {
        const day = new Date(o.created_at).toLocaleDateString("ms-MY", {
          day: "2-digit",
          month: "short",
        });
        grouped[day] = (grouped[day] || 0) + Number(o.total || 0);
      });

      const formatted = Object.entries(grouped).map(([day, total]) => ({ day, total }));
      setData(formatted);
    };

    fetchWeeklyData();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-xl font-semibold mb-4 text-blue-700 dark:text-yellow-400">
        📊 Jualan Mingguan
      </h3>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip formatter={(value) => `RM ${value.toFixed(2)}`} />
            <Bar dataKey="total" fill="#3b82f6" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500 text-center">Tiada data jualan minggu ini.</p>
      )}
    </div>
  );
}
