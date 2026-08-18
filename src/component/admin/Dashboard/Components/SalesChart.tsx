// app/dashboard/Components/SalesChart.tsx
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SalesTrendPoint } from "@/lib/api/actions/dashboard";

interface Props {
  data: SalesTrendPoint[];
}

const formatBDT = (value: number) =>
  value >= 1000 ? `৳${(value / 1000).toFixed(0)}k` : `৳${value}`;

export default function SalesChart({ data }: Props) {
  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400">
        No sales data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />

        {/* Left axis — revenue */}
        <YAxis
          yAxisId="revenue"
          orientation="left"
          tickFormatter={formatBDT}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          width={52}
        />

        {/* Right axis — orders */}
        <YAxis
          yAxisId="orders"
          orientation="right"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          width={30}
        />

        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
          }}
          formatter={(value, name) => {
            const numVal = typeof value === "number" ? value : Number(value);
            if (name === "revenue") {
              return [`৳${numVal.toLocaleString()}`, "Revenue"];
            }
            return [numVal, "Orders"];
          }}
        />

        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
          formatter={(value) => (value === "revenue" ? "Revenue" : "Orders")}
        />

        <Area
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#colorRevenue)"
          dot={false}
          activeDot={{ r: 4 }}
        />

        <Area
          yAxisId="orders"
          type="monotone"
          dataKey="orders"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#colorOrders)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
