// app/dashboard/Components/StatsGrid.tsx
import {
  TrendingUp,
  ShoppingBag,
  ReceiptText,
  Users,
  AlertTriangle,
  Percent,
} from "lucide-react";
import type { DashboardStats } from "@/lib/api/actions/dashboard";

interface Props {
  stats: DashboardStats;
}

const fmt = {
  currency: (n: number) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    }).format(n),
  number: (n: number) => new Intl.NumberFormat("en-BD").format(n),
  percent: (n: number) => `${n}%`,
};

export default function StatsGrid({ stats }: Props) {
  const cards = [
    {
      label: "Total Revenue",
      value: fmt.currency(stats.totalRevenue),
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Total Orders",
      value: fmt.number(stats.totalOrders),
      icon: ShoppingBag,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50",
    },
    {
      label: "Avg Order Value",
      value: fmt.currency(stats.avgOrderValue),
      icon: ReceiptText,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-50",
    },
    {
      label: "Active Users",
      value: fmt.number(stats.activeUsers),
      icon: Users,
      iconColor: "text-sky-600",
      iconBg: "bg-sky-50",
    },
    {
      label: "Inventory Alerts",
      value: fmt.number(stats.inventoryAlerts),
      icon: AlertTriangle,
      iconColor: stats.inventoryAlerts > 0 ? "text-amber-600" : "text-gray-400",
      iconBg: stats.inventoryAlerts > 0 ? "bg-amber-50" : "bg-gray-50",
    },
    {
      label: "Conversion Rate",
      value: fmt.percent(stats.conversionRate),
      icon: Percent,
      iconColor: "text-rose-600",
      iconBg: "bg-rose-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col gap-3"
          >
            <div
              className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center`}
            >
              <Icon size={18} className={card.iconColor} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-lg font-semibold text-gray-900 mt-0.5 leading-tight">
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
