"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Search,
  AlertTriangle,
  PackageX,
  History,
  SlidersHorizontal,
  X,
} from "lucide-react";
import axios from "axios";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useInventorySocket from "@/hooks/Inventory/useInventorySocket";
import { useHasPermission } from "@/context/PermissionsContext";
import {
  AdjustReason,
  InventoryListResponse,
  InventoryRow,
  LowStockResponse,
  StockHistoryEntry,
} from "@/types/inventory";

const TAKE = 20;

const REASON_OPTIONS: { value: AdjustReason; label: string }[] = [
  { value: "RESTOCK", label: "Restock" },
  { value: "CORRECTION", label: "Correction" },
  { value: "DAMAGE", label: "Damage" },
  { value: "OTHER", label: "Other" },
];

export default function InventoryManagement() {
  const axiosSecure = useAxiosSecure();
  const searchParams = useSearchParams();
  const canAdjustStock = useHasPermission("INVENTORY_MANAGE");

  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(
    () => searchParams.get("onlyLowStock") === "true",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);

  const [adjustTarget, setAdjustTarget] = useState<InventoryRow | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState<AdjustReason>("RESTOCK");
  const [note, setNote] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const [historyTarget, setHistoryTarget] = useState<InventoryRow | null>(
    null,
  );
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosSecure.get<InventoryListResponse>(
        "/inventory",
        {
          params: {
            search: search || undefined,
            onlyLowStock: onlyLowStock || undefined,
            skip: page * TAKE,
            take: TAKE,
          },
        },
      );
      setRows(data.items);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  }, [axiosSecure, search, onlyLowStock, page]);

  const fetchLowStockCount = useCallback(async () => {
    try {
      const { data } = await axiosSecure.get<LowStockResponse>(
        "/inventory/low-stock",
      );
      setLowStockCount(data.count);
    } catch {
      // non-critical — badge just won't update
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    fetchLowStockCount();
  }, [fetchLowStockCount]);

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setPage(0), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Live updates — patch the matching row in place, no full refetch
  useInventorySocket({
    onStockUpdated: (payload) => {
      setRows((prev) =>
        prev.map((row) =>
          row.productSizeId === payload.productSizeId
            ? {
                ...row,
                quantity: payload.quantity,
                lowStockAt: payload.lowStockAt,
                isLowStock: payload.quantity <= payload.lowStockAt,
              }
            : row,
        ),
      );
    },
    onStockLow: (payload) => {
      const row = rows.find((r) => r.productSizeId === payload.productSizeId);
      toast.error(
        `Low stock: ${row?.product.title ?? `#${payload.productSizeId}`} (${payload.quantity} left)`,
      );
      fetchLowStockCount();
    },
  });

  const openAdjust = (row: InventoryRow) => {
    setAdjustTarget(row);
    setDelta("");
    setReason("RESTOCK");
    setNote("");
  };

  const handleAdjust = async () => {
    if (!adjustTarget) return;
    const deltaNum = Number(delta);
    if (!delta || Number.isNaN(deltaNum) || deltaNum === 0) {
      toast.error("Enter a non-zero quantity change");
      return;
    }

    setIsAdjusting(true);
    try {
      await axiosSecure.post(
        `/inventory/${adjustTarget.productSizeId}/adjust`,
        { delta: deltaNum, reason, note: note.trim() || undefined },
      );
      toast.success("Stock adjusted");
      setAdjustTarget(null);
      fetchRows();
      fetchLowStockCount();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : null;
      toast.error(msg ?? "Failed to adjust stock");
    } finally {
      setIsAdjusting(false);
    }
  };

  const openHistory = async (row: InventoryRow) => {
    setHistoryTarget(row);
    setIsHistoryLoading(true);
    try {
      const { data } = await axiosSecure.get<StockHistoryEntry[]>(
        `/inventory/${row.productSizeId}/history`,
      );
      setHistory(data);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / TAKE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Live stock levels — updates automatically, no refresh needed
          </p>
        </div>
        {lowStockCount > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-medium">
            <AlertTriangle size={14} />
            {lowStockCount} item{lowStockCount > 1 ? "s" : ""} need restocking
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>
        <button
          onClick={() => {
            setOnlyLowStock((v) => !v);
            setPage(0);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            onlyLowStock
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal size={14} />
          Needs restocking
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-sm text-gray-400">
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-500">
            No inventory items found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Product
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">
                  SKU
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Quantity
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => {
                return (
                  <tr key={row.productSizeId} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {row.product.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {[row.color, row.size].filter(Boolean).join(" / ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell font-mono text-xs text-gray-500">
                      {row.sku ?? row.product.sku ?? "—"}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {row.quantity}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.quantity <= 0
                            ? "bg-red-100 text-red-700"
                            : row.isLowStock
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {row.quantity <= 0 ? (
                          <PackageX size={10} />
                        ) : (
                          row.isLowStock && <AlertTriangle size={10} />
                        )}
                        {row.quantity <= 0
                          ? "Out of Stock"
                          : row.isLowStock
                            ? "Low Stock"
                            : "In Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openHistory(row)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="History"
                        >
                          <History size={14} />
                        </button>
                        {canAdjustStock &&
                          (row.trackingMode === "PIECE_BARCODE" ? (
                            <button
                              disabled
                              title="Piece-tracked — adjust via Receive/Return scans, not a manual quantity edit"
                              className="px-3 py-1.5 text-xs font-medium text-gray-300 cursor-not-allowed rounded-lg"
                            >
                              Adjust
                            </button>
                          ) : (
                            <button
                              onClick={() => openAdjust(row)}
                              className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              Adjust
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > TAKE && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Page {page + 1} of {totalPages} — {total} items
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                Adjust Stock
              </h3>
              <button
                onClick={() => setAdjustTarget(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {adjustTarget.product.title}
                </p>
                <p className="text-xs text-gray-400">
                  {[adjustTarget.color, adjustTarget.size]
                    .filter(Boolean)
                    .join(" / ")}{" "}
                  · Current quantity: {adjustTarget.quantity}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Quantity change <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                  placeholder="e.g. 10 or -2"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Positive to add stock, negative to remove
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as AdjustReason)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Optional context…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setAdjustTarget(null)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                disabled={isAdjusting}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isAdjusting ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History modal */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Stock History
                </h3>
                <p className="text-xs text-gray-400">
                  {historyTarget.product.title}
                </p>
              </div>
              <button
                onClick={() => setHistoryTarget(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {isHistoryLoading ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  Loading…
                </div>
              ) : history.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  No movement recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between border-b border-gray-100 pb-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {entry.reason.replaceAll("_", " ")}
                          {entry.note && (
                            <span className="text-gray-400 font-normal">
                              {" "}
                              — {entry.note}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(entry.createdAt).toLocaleString()}
                          {entry.admin?.name && ` · ${entry.admin.name}`}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          entry.delta >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {entry.delta >= 0 ? "+" : ""}
                        {entry.delta}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
