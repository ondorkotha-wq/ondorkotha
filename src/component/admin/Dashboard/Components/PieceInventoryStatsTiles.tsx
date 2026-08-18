"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PackageCheck, PackageX, Truck, ClipboardList } from "lucide-react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useInventorySocket from "@/hooks/Inventory/useInventorySocket";
import { InventorySummary } from "@/types/piece-dashboard.types";

// Self-contained: fetches piece-level counts independently of the
// server-rendered DashboardStats pipeline that feeds <StatsGrid>, so this
// tile row can ship additively without touching that existing data flow.
export default function PieceInventoryStatsTiles() {
  const axiosSecure = useAxiosSecure();
  const [summary, setSummary] = useState<InventorySummary | null>(null);

  const fetchSummary = useCallback(() => {
    axiosSecure
      .get<InventorySummary>("/pieces/dashboard/inventory-summary")
      .then(({ data }) => setSummary(data))
      .catch(() => {});
  }, [axiosSecure]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Refetch (debounced) whenever a stock event comes in over the realtime
  // channel — a bulk operation (e.g. a multi-item order) can emit several
  // events in a tight loop, so we coalesce them into one refetch.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFetchSummary = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchSummary, 500);
  }, [fetchSummary]);

  useInventorySocket({
    onStockUpdated: debouncedFetchSummary,
    onStockLow: debouncedFetchSummary,
  });

  if (!summary) return null;

  const totalTracked = Object.values(summary).reduce((a, b) => a + b, 0);
  if (totalTracked === 0) return null; // no piece-tracked variants yet

  const cards = [
    {
      label: "In Stock (Pieces)",
      value: summary.IN_STOCK,
      icon: PackageCheck,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Reserved + Picked",
      value: summary.RESERVED + summary.PICKED,
      icon: ClipboardList,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      label: "In Transit",
      value: summary.SHIPPED,
      icon: Truck,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50",
    },
    {
      label: "Damaged",
      value: summary.DAMAGED_INCOMING + summary.DAMAGED_RETURN,
      icon: PackageX,
      iconColor:
        summary.DAMAGED_INCOMING + summary.DAMAGED_RETURN > 0
          ? "text-red-600"
          : "text-gray-400",
      iconBg:
        summary.DAMAGED_INCOMING + summary.DAMAGED_RETURN > 0
          ? "bg-red-50"
          : "bg-gray-50",
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
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
