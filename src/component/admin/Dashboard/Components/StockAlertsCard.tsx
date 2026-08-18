"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { PackageX, AlertTriangle } from "lucide-react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useInventorySocket from "@/hooks/Inventory/useInventorySocket";
import { InventoryRow, LowStockResponse } from "@/types/inventory";

const MAX_ROWS = 5;

// Self-contained, same pattern as StalePieceAlertCard/ReturningAlertCard —
// fetches independently so it ships additively without touching the
// existing dashboard data pipeline. Reuses the canonical /inventory/low-stock
// endpoint (quantity <= lowStockAt) and splits the result into out-of-stock
// vs low-stock client-side, matching low-stock-alert.service.ts's split.
export default function StockAlertsCard() {
  const axiosSecure = useAxiosSecure();
  const [items, setItems] = useState<InventoryRow[] | null>(null);

  const fetchAlerts = useCallback(() => {
    axiosSecure
      .get<LowStockResponse>("/inventory/low-stock")
      .then(({ data }) => setItems(data.items))
      .catch(() => {});
  }, [axiosSecure]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useInventorySocket({
    onStockLow: (payload) => {
      toast.error(`Low stock: ${payload.quantity} left on product #${payload.productId}`);
      fetchAlerts();
    },
    onStockUpdated: fetchAlerts,
  });

  if (!items || items.length === 0) return null;

  const outOfStock = items.filter((i) => i.quantity <= 0);
  const lowStock = items.filter((i) => i.quantity > 0);
  const rows = [...outOfStock, ...lowStock].slice(0, MAX_ROWS);

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Stock Alerts
          </h2>
          <p className="text-sm text-gray-500">
            Variants at or below their low-stock threshold
          </p>
        </div>
        <div className="flex items-center gap-2">
          {outOfStock.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              <PackageX size={12} />
              {outOfStock.length} out of stock
            </span>
          )}
          {lowStock.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              <AlertTriangle size={12} />
              {lowStock.length} low stock
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {rows.map((row) => (
          <div
            key={row.productSizeId}
            className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {row.product.title}
              </p>
              <p className="text-xs text-gray-400">
                {[row.color, row.size].filter(Boolean).join(" / ")}
              </p>
            </div>
            <span
              className={`shrink-0 ml-4 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                row.quantity <= 0
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {row.quantity <= 0 ? "Out of stock" : `${row.quantity} left`}
            </span>
          </div>
        ))}
      </div>

      <div className="px-6 py-3 border-t border-gray-200 text-right">
        <Link
          href="/admin/inventory?onlyLowStock=true"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all {items.length} in Inventory →
        </Link>
      </div>
    </div>
  );
}
