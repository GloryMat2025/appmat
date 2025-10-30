import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function MonthlySalesChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      const startOfYear = new Date();
      startOfYear.setMonth(startOfYear.getMonth() - 11);
      const from = startOfYear.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("orders")
        .select("total, created_at")
        .gte("created_at", from);

      if (error) {
        console.error("Ralat ambil data jualan bulanan:", error);
        return;
      }

      // Kumpul jumlah ikut bulan
      const grouped = {};
      data.forEach((o) => {
        const date = new Date(o.created_at);
        const month = date.toLocaleDateString("ms-MY", { month: "short", year: "numeric" });
        grouped[month] = (grouped[month] || 0) + Number(o.total || 0);
      });

      const formatted = Object.entries(grouped).map(([month, total]) => ({
        month,
        total,
      }));

      // Susun ikut masa
      formatted.sort(
        (a, b) =>
          new Date(a.month.split(" ")[1], new Date(Date.parse(a.month)).getMonth()) -
          new Date(b.month.split(" ")[1], new Date(Date.parse(b.month)).getMonth())
      );

      setData(formatted);
    };

    fetchMonthlyData();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-xl font-semibold mb-4 text-blue-700 dark:text-yellow-400">
        📈 Jualan Bulanan (12 Bulan Terkini)
      </h3>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => `RM ${v.toFixed(2)}`} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500 text-center">Tiada data jualan bulanan.</p>
      )}
    </div>
  );
}
