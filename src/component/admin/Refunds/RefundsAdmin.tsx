/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import toast from "react-hot-toast";
import { Clock, RefreshCw, CheckCircle2, XCircle, Plus, X } from "lucide-react";
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
import useRefunds from "@/hooks/Refunds/useRefunds";
import { PaymentRefund, RefundStatus } from "@/types/refund.types";
import { useHasPermission } from "@/context/PermissionsContext";

// ── Status config ─────────────────────────────────────────────────────────────
const REFUND_STATUS: Record<
  RefundStatus,
  { label: string; color: string; dot: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Pending",
    color: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
    icon: <Clock className="w-3 h-3" />,
  },
  PROCESSING: {
    label: "Processing",
    color: "bg-amber-50 text-amber-700",
    dot: "bg-amber-400 animate-pulse",
    icon: <RefreshCw className="w-3 h-3" />,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  FAILED: {
    label: "Failed",
    color: "bg-red-50 text-red-700",
    dot: "bg-red-500",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const REFUND_STATUS_OPTIONS = (Object.keys(REFUND_STATUS) as RefundStatus[]).map(
  (s) => ({ label: REFUND_STATUS[s].label, value: s }),
);

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

// ── New Direct Refund Modal ────────────────────────────────────────────────────
function NewDirectRefundModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const axiosSecure = useAxiosSecure();
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!orderId.trim() || !reason.trim()) {
      toast.error("Order ID and reason are required");
      return;
    }
    setSubmitting(true);
    try {
      await axiosSecure.post(`/orders/${orderId.trim()}/refund`, {
        reason: reason.trim(),
        amount: amount ? Number(amount) : undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Refund initiated");
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to initiate refund");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">No return needed</p>
            <h3 className="text-base font-semibold text-gray-900">
              New Direct Refund
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">
            For orders that are <strong>Cancelled</strong> or <strong>Failed</strong>{" "}
            but already paid online — no physical return involved.
          </p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Order ID
            </label>
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="ORD-20260622-1234-000001"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Reason
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Order cancelled before shipping"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Amount (optional — defaults to full refundable balance)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Leave blank for full amount"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Initiate Refund"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────────
function RefundDetailDrawer({
  id,
  onClose,
  onRefresh,
}: {
  id: number;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const axiosSecure = useAxiosSecure();
  const [data, setData] = useState<PaymentRefund | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosSecure.get(`/refunds/${id}`);
      setData(res.data);
    } catch {
      toast.error("Failed to load refund");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleComplete = async () => {
    setWorking(true);
    try {
      await axiosSecure.patch(`/refunds/${id}/complete`, {
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Refund marked as completed");
      await load();
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to complete refund");
    } finally {
      setWorking(false);
    }
  };

  const handleSync = async () => {
    setWorking(true);
    try {
      const res = await axiosSecure.patch(`/refunds/${id}/sync`);
      setData(res.data);
      toast.success("Synced with gateway");
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to sync with gateway");
    } finally {
      setWorking(false);
    }
  };

  const canManage = useHasPermission("REFUND_MANAGE");
  const cfg = data ? REFUND_STATUS[data.status] : null;
  const isActionable =
    canManage && data && ["PENDING", "PROCESSING"].includes(data.status);

  return (
    <DetailDrawer
      open
      onClose={onClose}
      title={data ? `Refund #${data.id}` : "Loading…"}
      subtitle={data?.payment?.order?.orderId}
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
              <Badge
                label={data.refundMethod}
                colorClass="bg-gray-100 text-gray-600"
              />
            </div>
          </DrawerSection>

          <DrawerSection title="Refund">
            <DrawerRow label="Amount" value={taka(data.amount)} highlight />
            <DrawerRow label="Reason" value={data.reason} />
            <DrawerRow label="Order" value={data.payment?.order?.orderId} mono />
            <DrawerRow
              label="Customer"
              value={data.payment?.order?.customerName}
            />
            <DrawerRow
              label="Payment Method"
              value={data.payment?.method}
            />
            <DrawerRow
              label="Transaction ID"
              value={data.payment?.transactionId}
              mono
            />
            {data.gatewayRefundId && (
              <DrawerRow label="Gateway Ref" value={data.gatewayRefundId} mono />
            )}
            {data.processedAt && (
              <DrawerRow label="Processed" value={fmtDateTime(data.processedAt)} />
            )}
            <DrawerRow label="Created" value={fmtDateTime(data.createdAt)} />
            {data.notes && <DrawerRow label="Notes" value={data.notes} />}
          </DrawerSection>

          {data.returnRequestId && (
            <DrawerSection title="Linked Return Request">
              <DrawerRow label="Return #" value={data.returnRequestId} mono />
            </DrawerSection>
          )}

          {isActionable && data.refundMethod === "MANUAL" && (
            <DrawerSection title="Complete Manual Refund" tint="amber">
              <p className="text-xs text-gray-500 mb-2">
                Confirm once the money has actually been sent (bank transfer,
                mobile banking, or cash).
              </p>
              <div className="space-y-2">
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Reference (txn ID, voucher no.) — optional"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400"
                />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (optional)…"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400 resize-none"
                />
                <button
                  onClick={handleComplete}
                  disabled={working}
                  className="w-full py-2.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {working ? "Saving…" : "Mark as Completed"}
                </button>
              </div>
            </DrawerSection>
          )}

          {isActionable && data.refundMethod === "GATEWAY" && (
            <DrawerSection title="Gateway Status" tint="slate">
              <p className="text-xs text-gray-500 mb-2">
                SSLCommerz refunds settle asynchronously — sync to pull the
                latest status.
              </p>
              <button
                onClick={handleSync}
                disabled={working}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${working ? "animate-spin" : ""}`} />
                {working ? "Syncing…" : "Sync with Gateway"}
              </button>
            </DrawerSection>
          )}
        </>
      )}
    </DetailDrawer>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const LIMIT = 20;

export default function RefundsAdmin() {
  const canManage = useHasPermission("REFUND_MANAGE");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RefundStatus | "">("");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const { refunds, isLoading, refetch } = useRefunds({
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

  const rows = refunds?.data ?? [];
  const meta = refunds?.meta ?? { total: 0, page: 1, limit: LIMIT, totalPages: 1 };
  const totalAmount = rows
    .filter((r) => r.status === "COMPLETED")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Sales" title="Refunds">
        {canManage && (
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Direct Refund
          </button>
        )}
      </PageHeader>

      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Refunds" value={meta.total} accent />
          <StatCard
            label="Completed (this page)"
            value={taka(totalAmount)}
            sub={`${rows.filter((r) => r.status === "COMPLETED").length} record(s)`}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Search order ID, customer, transaction ID…"
            className="flex-1 min-w-55"
          />
          <FilterSelect
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={REFUND_STATUS_OPTIONS}
            placeholder="All Statuses"
          />
          {hasFilters && <ClearFiltersButton onClick={clearFilters} />}
          <RefreshButton onClick={() => refetch()} loading={isLoading} />
        </div>

        <AdminTable
          headers={[
            "Order",
            "Customer",
            "Method",
            "Amount",
            "Status",
            "Initiated",
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
            const cfg = REFUND_STATUS[r.status];
            return (
              <tr
                key={r.id}
                onClick={() => setDetailId(r.id)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <p className="font-mono text-xs font-medium text-gray-900">
                    {r.payment?.order?.orderId ?? "—"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">#{r.id}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-xs font-medium text-gray-900 leading-tight">
                    {r.payment?.order?.customerName ?? "—"}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <Badge
                    label={r.refundMethod}
                    colorClass="bg-gray-100 text-gray-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {r.payment?.method}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-mono font-medium text-gray-900">
                    {taka(r.amount)}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </td>
                <td className="px-4 py-4 pr-6">
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
        <RefundDetailDrawer
          id={detailId}
          onClose={() => setDetailId(null)}
          onRefresh={refetch}
        />
      )}

      {showNewModal && (
        <NewDirectRefundModal
          onClose={() => setShowNewModal(false)}
          onCreated={refetch}
        />
      )}
    </div>
  );
}
