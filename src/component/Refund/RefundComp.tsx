/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Package,
  CreditCard,
  MessageSquare,
  ArrowLeft,
  FileText,
  Ban,
  PackageCheck,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useTrackOrder from "@/hooks/Track/useTrack";
import useMyReturnRequests from "@/hooks/Returns/useMyReturnRequests";
import {
  formatReturnReason,
  RETURN_REASON_OPTIONS,
  ReturnRequest,
  ReturnRequestStatus,
} from "@/types/refund.types";

const STATUS_CONFIG: Record<
  ReturnRequestStatus,
  { label: string; icon: React.ReactNode; colorClass: string }
> = {
  PENDING: {
    label: "Under Review",
    icon: <Clock className="w-4 h-4 text-amber-600" />,
    colorClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  APPROVED: {
    label: "Approved",
    icon: <CheckCircle className="w-4 h-4 text-blue-600" />,
    colorClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ITEM_RECEIVED: {
    label: "Item Received",
    icon: <PackageCheck className="w-4 h-4 text-violet-600" />,
    colorClass: "bg-violet-50 text-violet-700 border-violet-200",
  },
  REFUNDED: {
    label: "Refunded",
    icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
    colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  REJECTED: {
    label: "Declined",
    icon: <XCircle className="w-4 h-4 text-red-600" />,
    colorClass: "bg-red-50 text-red-700 border-red-200",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: <Ban className="w-4 h-4 text-gray-500" />,
    colorClass: "bg-gray-50 text-gray-600 border-gray-200",
  },
};

const taka = (n: number) =>
  `৳${Number(n).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// ── New Return Request Modal ───────────────────────────────────────────────────
function NewReturnRequestModal({
  defaultOrderId,
  onClose,
  onSubmitted,
}: {
  defaultOrderId?: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const axiosSecure = useAxiosSecure();
  const [orderIdInput, setOrderIdInput] = useState(defaultOrderId ?? "");
  const [lookupId, setLookupId] = useState<string | null>(
    defaultOrderId ?? null,
  );
  const {
    order,
    isLoading: orderLoading,
    isError: orderError,
  } = useTrackOrder({ trackingId: lookupId ?? "", details: true });

  const [selected, setSelected] = useState<Record<number, number>>({});
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFind = () => {
    if (!orderIdInput.trim()) {
      toast.error("Enter your order number or tracking ID");
      return;
    }
    setSelected({});
    setLookupId(orderIdInput.trim());
  };

  const eligible =
    !!order && ["DELIVERED", "PARTIALLY_DELIVERED"].includes(order.status);

  const toggleItem = (itemId: number, maxQty: number) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[itemId]) delete next[itemId];
      else next[itemId] = maxQty;
      return next;
    });
  };

  const setQty = (itemId: number, qty: number, maxQty: number) => {
    setSelected((prev) => ({
      ...prev,
      [itemId]: Math.max(1, Math.min(qty || 1, maxQty)),
    }));
  };

  const selectedCount = Object.keys(selected).length;

  const handleSubmit = async () => {
    if (!lookupId) return;
    if (!reason.trim()) {
      toast.error("Please select a reason for the return");
      return;
    }
    if (selectedCount === 0) {
      toast.error("Select at least one item to return");
      return;
    }
    setSubmitting(true);
    try {
      await axiosSecure.post(`/orders/${lookupId}/return-request`, {
        reason,
        note: note.trim() || undefined,
        items: Object.entries(selected).map(([orderItemId, quantity]) => ({
          orderItemId: Number(orderItemId),
          quantity,
        })),
      });
      toast.success("Return request submitted");
      onSubmitted();
      onClose();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ?? "Failed to submit return request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              New Return Request
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-sm"
            >
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order lookup */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFind()}
                placeholder="e.g. ORD-20260101-1234-000001"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
              <button
                onClick={handleFind}
                disabled={orderLoading}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-sm hover:bg-gray-800 transition disabled:opacity-50"
              >
                {orderLoading ? "Finding…" : "Find"}
              </button>
            </div>
            {lookupId && orderError && (
              <p className="text-xs text-red-600 mt-2">
                Order not found. Please check the order number and try again.
              </p>
            )}
            {lookupId && order && !eligible && (
              <p className="text-xs text-amber-600 mt-2">
                This order is currently &quot;{order.status}&quot; — only
                delivered orders can be returned.
              </p>
            )}
          </div>

          {/* Items */}
          {order && eligible && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Item(s) to Return
                </label>
                <div className="space-y-2">
                  {order.items.map((item) => {
                    const isSelected = selected[item.id] !== undefined;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 border rounded-sm transition-colors ${
                          isSelected
                            ? "border-gray-900 bg-gray-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item.id, item.quantity)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {[item.color, item.size].filter(Boolean).join(" · ")}{" "}
                            {item.color || item.size ? "· " : ""}
                            Purchased qty: {item.quantity} · {taka(item.price)}
                            /unit
                          </p>
                        </div>
                        {isSelected && (
                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={selected[item.id]}
                            onChange={(e) =>
                              setQty(item.id, Number(e.target.value), item.quantity)
                            }
                            className="w-16 px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-center"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Return
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                >
                  <option value="">Select a reason</option>
                  {RETURN_REASON_OPTIONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Please provide any additional details about your return..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
            </>
          )}

          <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-medium">Return Policy Reminders:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Items must be returned within 7 days of delivery</li>
                  <li>An admin will review your request before approval</li>
                  <li>
                    Refunds are issued after the returned item(s) reach our
                    warehouse
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !order || !eligible}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-sm hover:bg-gray-800 transition disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const RefundCompContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkOrderId = searchParams.get("orderId");

  const { returnRequests, isLoading, refetch } = useMyReturnRequests();
  const [expandedRefund, setExpandedRefund] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewRequest, setShowNewRequest] = useState(!!deepLinkOrderId);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const axiosSecure = useAxiosSecure();

  const refundsPerPage = 4;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const filteredRefunds = returnRequests.filter((r) => {
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      String(r.id).includes(q) ||
      (r.order?.orderId ?? "").toLowerCase().includes(q) ||
      r.items.some((item) =>
        (item.orderItem?.productTitle ?? "").toLowerCase().includes(q),
      );
    return matchesStatus && matchesSearch;
  });

  const indexOfLastRefund = currentPage * refundsPerPage;
  const indexOfFirstRefund = indexOfLastRefund - refundsPerPage;
  const currentRefunds = filteredRefunds.slice(
    indexOfFirstRefund,
    indexOfLastRefund,
  );
  const totalPages = Math.ceil(filteredRefunds.length / refundsPerPage);

  const totalRefunded = returnRequests.reduce(
    (sum, r) =>
      sum +
      (r.refunds?.filter((f) => f.status === "COMPLETED").reduce(
        (s, f) => s + f.amount,
        0,
      ) ?? 0),
    0,
  );

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await axiosSecure.patch(`/orders/return-requests/${id}/cancel`);
      toast.success("Return request cancelled");
      refetch();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ?? "Failed to cancel return request",
      );
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      {showNewRequest && (
        <NewReturnRequestModal
          defaultOrderId={deepLinkOrderId ?? undefined}
          onClose={() => setShowNewRequest(false)}
          onSubmitted={refetch}
        />
      )}

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link
            href="/customer/orders"
            className="hover:text-gray-700 transition flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Orders
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 mb-1">
              Refunds & Returns
            </h1>
            <p className="text-sm text-gray-500">
              Manage your return requests and refund status
            </p>
          </div>
          <button
            onClick={() => setShowNewRequest(true)}
            className="px-4 py-2.5 text-sm bg-gray-900 text-white rounded-sm hover:bg-gray-800 transition flex items-center gap-2 w-fit"
          >
            <FileText className="w-4 h-4" />
            New Return Request
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total Requests</p>
          <p className="text-2xl font-medium text-gray-900">
            {returnRequests.length}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Under Review</p>
          <p className="text-2xl font-medium text-gray-900">
            {returnRequests.filter((r) => r.status === "PENDING").length}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
          <p className="text-xs text-gray-500 mb-1">In Progress</p>
          <p className="text-2xl font-medium text-gray-900">
            {
              returnRequests.filter((r) =>
                ["APPROVED", "ITEM_RECEIVED"].includes(r.status),
              ).length
            }
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total Refunded</p>
          <p className="text-2xl font-medium text-gray-900">
            {taka(totalRefunded)}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by request ID, order number, or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 text-sm border border-gray-300 rounded-sm hover:bg-gray-50 transition focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          >
            <option value="all">All Status</option>
            {(Object.keys(STATUS_CONFIG) as ReturnRequestStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Refunds List */}
      <div className="space-y-3 mb-8">
        {isLoading ? (
          <div className="text-center py-16 border border-gray-200 rounded-sm">
            <p className="text-gray-500 text-sm">Loading your requests…</p>
          </div>
        ) : currentRefunds.length === 0 ? (
          <div className="text-center py-16 border border-gray-200 rounded-sm">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-700 text-base">No return requests found</p>
            <p className="text-gray-500 text-xs mt-1">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "You haven't submitted any return requests yet"}
            </p>
          </div>
        ) : (
          currentRefunds.map((refund: ReturnRequest) => {
            const cfg = STATUS_CONFIG[refund.status];
            const itemCount = refund.items.reduce((s, i) => s + i.quantity, 0);
            const refundRecord = refund.refunds?.[0];
            return (
              <div
                key={refund.id}
                className="border border-gray-200 rounded-sm overflow-hidden"
              >
                <div className="p-5 bg-white">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {cfg.icon}
                        <div>
                          <h3 className="font-medium text-base text-gray-900">
                            Return #{refund.id}
                          </h3>
                          <p className="text-xs text-gray-500">
                            For Order {refund.order?.orderId ?? refund.orderId}{" "}
                            • Submitted {fmtDate(refund.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-sm text-xs font-normal border ${cfg.colorClass}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>
                          {itemCount} {itemCount === 1 ? "item" : "items"} to
                          return
                        </p>
                        {refundRecord && (
                          <p>
                            Refund: {taka(refundRecord.amount)} (
                            {refundRecord.status})
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {refund.status === "PENDING" && (
                        <button
                          onClick={() => handleCancel(refund.id)}
                          disabled={cancellingId === refund.id}
                          className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-sm hover:bg-red-50 transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          {cancellingId === refund.id ? "Cancelling…" : "Cancel"}
                        </button>
                      )}
                      <button
                        onClick={() => router.push("/help/contact-us")}
                        className="px-3 py-1.5 text-xs border border-gray-300 rounded-sm hover:bg-gray-50 transition flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Contact Support
                      </button>
                      <button
                        onClick={() =>
                          setExpandedRefund(
                            expandedRefund === refund.id ? null : refund.id,
                          )
                        }
                        className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-sm hover:bg-gray-800 transition flex items-center gap-1.5"
                      >
                        Details
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            expandedRefund === refund.id ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {expandedRefund === refund.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-5">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium text-sm mb-3 text-gray-900">
                            Items Being Returned
                          </h4>
                          <div className="space-y-3">
                            {refund.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex gap-3 bg-white p-3 rounded-sm border border-gray-100"
                              >
                                <div className="w-14 h-14 bg-gray-50 rounded-sm flex items-center justify-center text-2xl border border-gray-100">
                                  <Package className="w-5 h-5 text-gray-300" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-xs text-gray-900">
                                    {item.orderItem?.productTitle ??
                                      `Item #${item.orderItemId}`}
                                  </p>
                                  <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-500">
                                        Returning Qty:
                                      </span>
                                      <span className="text-gray-900">
                                        {item.quantity}
                                      </span>
                                    </div>
                                    {item.orderItem && (
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">
                                          Price:
                                        </span>
                                        <span className="text-gray-900">
                                          {taka(item.orderItem.priceAtPurchase)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2 text-gray-900">
                            Reason
                          </h4>
                          <div className="bg-white p-3 rounded-sm border border-gray-100">
                            <p className="text-xs text-gray-700">
                              {formatReturnReason(refund.reason)}
                            </p>
                          </div>
                        </div>

                        {refund.note && (
                          <div>
                            <h4 className="font-medium text-sm mb-2 text-gray-900">
                              Your Notes
                            </h4>
                            <div className="bg-white p-3 rounded-sm border border-gray-100">
                              <p className="text-xs text-gray-700">
                                {refund.note}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        {refundRecord && (
                          <div>
                            <h4 className="font-medium text-sm mb-3 text-gray-900">
                              Refund Status
                            </h4>
                            <div className="bg-white p-4 rounded-sm border border-gray-100 space-y-3 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Amount</span>
                                <span className="text-gray-900 font-medium">
                                  {taka(refundRecord.amount)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className="text-gray-900">
                                  {refundRecord.status}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Method</span>
                                <span className="text-gray-900">
                                  {refundRecord.refundMethod === "GATEWAY"
                                    ? "Original Payment Method"
                                    : "Manual Transfer"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {refund.adminNote && (
                          <div>
                            <h4 className="font-medium text-sm mb-2 text-gray-900">
                              Response from Support
                            </h4>
                            <div className="bg-white p-3 rounded-sm border border-gray-100">
                              <p className="text-xs text-gray-700">
                                {refund.adminNote}
                              </p>
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium text-sm mb-2 text-gray-900">
                            Next Steps
                          </h4>
                          <div className="space-y-2">
                            {refund.status === "PENDING" && (
                              <div className="flex items-start gap-2 text-xs">
                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mt-0.5 flex-shrink-0">
                                  <span className="text-xs">1</span>
                                </div>
                                <p className="text-gray-700">
                                  Your request is under review. You&apos;ll
                                  receive an update once it&apos;s decided.
                                </p>
                              </div>
                            )}
                            {refund.status === "APPROVED" && (
                              <div className="flex items-start gap-2 text-xs">
                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mt-0.5 flex-shrink-0">
                                  <span className="text-xs">2</span>
                                </div>
                                <p className="text-gray-700">
                                  Approved — please send the item(s) back to
                                  us. We&apos;ll confirm once received.
                                </p>
                              </div>
                            )}
                            {refund.status === "ITEM_RECEIVED" && (
                              <div className="flex items-start gap-2 text-xs">
                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mt-0.5 flex-shrink-0">
                                  <span className="text-xs">3</span>
                                </div>
                                <p className="text-gray-700">
                                  We&apos;ve received your item(s) — your
                                  refund will be processed shortly.
                                </p>
                              </div>
                            )}
                            {refund.status === "REFUNDED" && (
                              <div className="flex items-start gap-2 text-xs">
                                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <p className="text-gray-700">
                                  Refund complete. Thank you for your
                                  patience.
                                </p>
                              </div>
                            )}
                            {refund.status === "REJECTED" && (
                              <div className="flex items-start gap-2 text-xs">
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <p className="text-gray-700">
                                  This request was declined
                                  {refund.adminNote ? " — see the response from support above." : "."}{" "}
                                  Contact support if you have questions.
                                </p>
                              </div>
                            )}
                            {refund.status === "CANCELLED" && (
                              <div className="flex items-start gap-2 text-xs">
                                <Ban className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <p className="text-gray-700">
                                  You cancelled this request. You can file a
                                  new one from this order if it&apos;s still
                                  within the return window.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-sm hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 text-xs rounded-sm transition ${
                  currentPage === page
                    ? "bg-gray-900 text-white"
                    : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-sm hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {filteredRefunds.length > 0 && (
        <div className="text-center mt-4 text-xs text-gray-500">
          Showing {indexOfFirstRefund + 1}-
          {Math.min(indexOfLastRefund, filteredRefunds.length)} of{" "}
          {filteredRefunds.length} return request(s)
        </div>
      )}

      {/* Help Section */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="font-medium text-base text-gray-900 mb-4">
          Need Help with Your Return?
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Return Policy
                </p>
                <p className="text-xs text-gray-600">
                  Returns are accepted within 7 days of delivery.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Contact Support
                </p>
                <p className="text-xs text-gray-600">
                  Get help with your return or ask questions.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Refund Methods
                </p>
                <p className="text-xs text-gray-600">
                  Online payments are refunded to the original method; COD
                  orders are refunded manually.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RefundComp = () => (
  <Suspense
    fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }
  >
    <RefundCompContent />
  </Suspense>
);

export default RefundComp;
