/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import toast from "react-hot-toast";
import {
  Badge,
  StatCard,
  SearchBar,
  FilterSelect,
  RefreshButton,
  ClearFiltersButton,
  AdminTable,
  MetaPagination,
  DetailDrawer,
  DrawerSection,
  DrawerRow,
  PageHeader,
} from "@/component/Shared/Admin/AdminUI/AdminUI";
import useReturnRequests from "@/hooks/Returns/useReturnRequests";
import {
  formatReturnReason,
  ReturnRequest,
  ReturnRequestStatus,
} from "@/types/refund.types";
import { useHasPermission } from "@/context/PermissionsContext";

// ── Status config ─────────────────────────────────────────────────────────────
const RETURN_STATUS: Record<
  ReturnRequestStatus,
  { label: string; color: string; dot: string }
> = {
  PENDING: {
    label: "Pending Review",
    color: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
  APPROVED: {
    label: "Approved",
    color: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  ITEM_RECEIVED: {
    label: "Item Received",
    color: "bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
  },
  REFUNDED: {
    label: "Refunded",
    color: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-500",
    dot: "bg-gray-400",
  },
};

const RETURN_STATUS_OPTIONS = (
  Object.keys(RETURN_STATUS) as ReturnRequestStatus[]
).map((s) => ({ label: RETURN_STATUS[s].label, value: s }));

const taka = (n: number) =>
  `৳ ${Number(n).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ── Detail Drawer ──────────────────────────────────────────────────────────────
function ReturnRequestDetailDrawer({
  id,
  onClose,
  onRefresh,
}: {
  id: number;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const axiosSecure = useAxiosSecure();
  const [data, setData] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const canManageReturn = useHasPermission("RETURN_MANAGE");
  const canManageRefund = useHasPermission("REFUND_MANAGE");

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosSecure.get(`/return-requests/${id}`);
      setData(res.data);
    } catch {
      toast.error("Failed to load return request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleReview = async (decision: "APPROVED" | "REJECTED") => {
    setWorking(true);
    try {
      await axiosSecure.patch(`/return-requests/${id}/review`, {
        decision,
        adminNote: adminNote.trim() || undefined,
      });
      toast.success(
        decision === "APPROVED" ? "Return request approved" : "Return request rejected",
      );
      setAdminNote("");
      await load();
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to review request");
    } finally {
      setWorking(false);
    }
  };

  const handleReceive = async () => {
    setWorking(true);
    try {
      await axiosSecure.patch(`/return-requests/${id}/receive`, {
        adminNote: adminNote.trim() || undefined,
      });
      toast.success(
        "Return request acknowledged — legacy items restocked, piece-tracked items need a scan",
      );
      setAdminNote("");
      await load();
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to mark as received");
    } finally {
      setWorking(false);
    }
  };

  const handleProcessRefund = async () => {
    setWorking(true);
    try {
      await axiosSecure.post(`/return-requests/${id}/refund`, {
        amount: refundAmount ? Number(refundAmount) : undefined,
        notes: refundNotes.trim() || undefined,
      });
      toast.success("Refund initiated");
      setRefundAmount("");
      setRefundNotes("");
      await load();
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to process refund");
    } finally {
      setWorking(false);
    }
  };

  const cfg = data ? RETURN_STATUS[data.status] : null;

  return (
    <DetailDrawer
      open
      onClose={onClose}
      title={data ? `Return #${data.id}` : "Loading…"}
      subtitle={data ? `Order ${data.order?.orderId ?? data.orderId}` : undefined}
    >
      {loading || !data ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          <DrawerSection title="Status">
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg!.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg!.dot}`} />
                {cfg!.label}
              </span>
              <span className="text-[10px] text-gray-400">
                Filed {fmtDateTime(data.createdAt)}
              </span>
            </div>
          </DrawerSection>

          <DrawerSection title="Customer & Order">
            <DrawerRow label="Customer" value={data.order?.customerName} />
            <DrawerRow label="Phone" value={data.order?.customerPhone} mono />
            <DrawerRow
              label="Order Status"
              value={data.order?.status}
            />
          </DrawerSection>

          <DrawerSection title="Reason">
            <p className="text-xs text-gray-700 font-medium">
              {formatReturnReason(data.reason)}
            </p>
            {data.note && (
              <p className="text-xs text-gray-500 mt-2 italic">“{data.note}”</p>
            )}
          </DrawerSection>

          <DrawerSection title="Items Being Returned">
            <div className="space-y-2 pt-1">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 leading-tight">
                      {item.orderItem?.productTitle ?? `Item #${item.orderItemId}`}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {[item.orderItem?.color, item.orderItem?.size, item.orderItem?.sku]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-semibold text-gray-800">
                      Returning {item.quantity}
                      {item.orderItem ? ` / ${item.orderItem.quantity}` : ""}
                    </p>
                    {item.orderItem && (
                      <p className="text-[10px] text-gray-400">
                        {taka(item.orderItem.priceAtPurchase)} / unit
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DrawerSection>

          {data.adminNote && (
            <DrawerSection title="Admin Note" tint="amber">
              <p className="text-xs text-gray-700">{data.adminNote}</p>
            </DrawerSection>
          )}

          {data.refunds && data.refunds.length > 0 && (
            <DrawerSection title="Refunds" tint="green">
              {data.refunds.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-1.5 border-b border-gray-100/60 last:border-0"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      {r.refundMethod === "GATEWAY" ? "Gateway Refund" : "Manual Refund"}
                    </p>
                    {r.processedAt && (
                      <p className="text-[10px] text-gray-400">
                        {fmtDateTime(r.processedAt)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-semibold text-gray-800">
                      {taka(r.amount)}
                    </p>
                    <Badge
                      label={r.status}
                      colorClass={
                        r.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700"
                          : r.status === "FAILED"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                      }
                    />
                  </div>
                </div>
              ))}
            </DrawerSection>
          )}

          {/* Actions */}
          {canManageReturn && data.status === "PENDING" && (
            <DrawerSection title="Review Request" tint="slate">
              <div className="space-y-2 pt-1">
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Optional note for the customer / internal record…"
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview("APPROVED")}
                    disabled={working}
                    className="flex-1 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-emerald-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview("REJECTED")}
                    disabled={working}
                    className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </DrawerSection>
          )}

          {canManageReturn && data.status === "APPROVED" && (
            <DrawerSection title="Receive Item(s)" tint="slate">
              <p className="text-[11px] text-gray-500 mb-2">
                Restocks any legacy (quantity-tracked) items automatically.
                Piece-tracked items are <strong>not</strong> restocked here —
                an Inventory Manager must scan the physical barcode in{" "}
                <a
                  href="/admin/pieces"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 underline"
                >
                  Piece Barcodes → Process Return
                </a>{" "}
                and mark it Good or Damaged before that unit counts as back
                in stock.
              </p>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Optional note…"
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none mb-2"
              />
              <button
                onClick={handleReceive}
                disabled={working}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Acknowledge Return Request
              </button>
            </DrawerSection>
          )}

          {canManageRefund && data.status === "ITEM_RECEIVED" && (
            <DrawerSection title="Process Refund" tint="amber">
              <p className="text-[11px] text-gray-500 mb-2">
                Leave the amount blank to refund the full value of the returned
                item(s). Online (SSL) payments are refunded via the gateway
                automatically; other methods are marked for manual transfer.
              </p>
              <div className="space-y-2">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Amount (optional override)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                />
                <textarea
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Notes (optional)…"
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none"
                />
                <button
                  onClick={handleProcessRefund}
                  disabled={working}
                  className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {working ? "Processing…" : "Process Refund"}
                </button>
              </div>
            </DrawerSection>
          )}
        </>
      )}
    </DetailDrawer>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const LIMIT = 20;

export default function ReturnRequestsAdmin() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReturnRequestStatus | "">("");
  const [detailId, setDetailId] = useState<number | null>(null);

  const { returnRequests, isLoading, refetch } = useReturnRequests({
    page,
    limit: LIMIT,
    status: status || undefined,
    search: search || undefined,
  });

  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const handleSearch = (v: string) => {
    setSearch(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPage(1);
  };

  const hasFilters = !!(search || status);

  const rows = returnRequests?.data ?? [];
  const meta = returnRequests?.meta ?? {
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <PageHeader eyebrow="Sales" title="Return Requests" />

      <div className="max-w-350 mx-auto px-8 py-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Requests" value={meta.total} accent />
          <StatCard
            label="On This Page"
            value={rows.length}
            sub={`Page ${meta.page} / ${meta.totalPages || 1}`}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Search order ID, customer name, phone…"
            className="flex-1 min-w-55"
          />
          <FilterSelect
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={RETURN_STATUS_OPTIONS}
            placeholder="All Statuses"
          />
          {hasFilters && <ClearFiltersButton onClick={clearFilters} />}
          <RefreshButton onClick={() => refetch()} loading={isLoading} />
        </div>

        <AdminTable
          headers={[
            "Order",
            "Customer",
            "Reason",
            "Items",
            "Status",
            "Refund",
            "Filed",
          ]}
          loading={isLoading}
          empty={rows.length === 0}
          emptyAction={
            hasFilters ? (
              <button
                onClick={clearFilters}
                className="text-xs text-indigo-600 hover:underline"
              >
                Clear filters
              </button>
            ) : undefined
          }
        >
          {rows.map((r) => {
            const cfg = RETURN_STATUS[r.status];
            const refund = r.refunds?.[0];
            return (
              <tr
                key={r.id}
                onClick={() => setDetailId(r.id)}
                className="hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <td className="px-5 py-3.5">
                  <p className="font-mono text-xs font-semibold text-gray-800 group-hover:text-indigo-600">
                    {r.order?.orderId ?? r.orderId}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">#{r.id}</p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-xs font-semibold text-gray-800 leading-tight">
                    {r.order?.customerName ?? "—"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {r.order?.customerPhone}
                  </p>
                </td>
                <td className="px-4 py-3.5 max-w-50">
                  <p className="text-xs text-gray-700 truncate">
                    {formatReturnReason(r.reason)}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-semibold text-gray-700 bg-gray-100">
                    {r.items.reduce((s, i) => s + i.quantity, 0)} pcs
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {refund ? (
                    <p className="text-xs font-mono font-semibold text-gray-800">
                      {taka(refund.amount)}{" "}
                      <span className="text-[10px] text-gray-400">
                        ({refund.status})
                      </span>
                    </p>
                  ) : (
                    <span className="text-[10px] text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 pr-5">
                  <p className="text-xs text-gray-500">{fmtDate(r.createdAt)}</p>
                </td>
              </tr>
            );
          })}
        </AdminTable>

        <MetaPagination
          meta={meta}
          page={page}
          onPageChange={setPage}
          limit={LIMIT}
        />
      </div>

      {detailId !== null && (
        <ReturnRequestDetailDrawer
          id={detailId}
          onClose={() => setDetailId(null)}
          onRefresh={refetch}
        />
      )}
    </div>
  );
}
