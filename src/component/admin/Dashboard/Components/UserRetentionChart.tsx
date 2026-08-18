// app/dashboard/Components/UserRetentionChart.tsx
"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { UserRetentionPoint } from "@/lib/api/actions/dashboard";

interface Props {
  data: UserRetentionPoint[];
}

export default function UserRetentionChart({ data }: Props) {
  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400">
        No retention data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
        />

        {/* Left axis — customer counts */}
        <YAxis
          yAxisId="customers"
          orientation="left"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          width={36}
        />

        {/* Right axis — retention rate % */}
        <YAxis
          yAxisId="rate"
          orientation="right"
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          width={42}
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
            if (name === "retentionRate") return [`${numVal}%`, "Retention Rate"];
            if (name === "newCustomers") return [numVal, "New Customers"];
            return [numVal, "Returning Customers"];
          }}
        />

        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
          formatter={(value) =>
            value === "retentionRate"
              ? "Retention Rate"
              : value === "newCustomers"
                ? "New Customers"
                : "Returning Customers"
          }
        />

        <Bar
          yAxisId="customers"
          dataKey="newCustomers"
          stackId="customers"
          fill="#6366f1"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          yAxisId="customers"
          dataKey="returningCustomers"
          stackId="customers"
          fill="#a5b4fc"
          radius={[4, 4, 0, 0]}
        />

        <Line
          yAxisId="rate"
          type="monotone"
          dataKey="retentionRate"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}