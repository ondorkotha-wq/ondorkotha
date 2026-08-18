/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import useOrders, { FullOrder, OrderStatus } from "@/hooks/Order/useOrders";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import {
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RotateCcw,
  Clock,
  PauseCircle,
} from "lucide-react";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: React.ReactNode; colorClass: string }
> = {
  PENDING: {
    label: "Pending",
    icon: <Clock className="w-4 h-4 text-gray-500" />,
    colorClass: "bg-gray-50 text-gray-600 border-gray-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: <CheckCircle className="w-4 h-4 text-blue-600" />,
    colorClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  PROCESSING: {
    label: "Processing",
    icon: <Package className="w-4 h-4 text-gray-700" />,
    colorClass: "bg-gray-50 text-gray-700 border-gray-200",
  },
  PACKED: {
    label: "Packed",
    icon: <Package className="w-4 h-4 text-gray-700" />,
    colorClass: "bg-gray-50 text-gray-700 border-gray-200",
  },
  SHIPPED: {
    label: "Shipped",
    icon: <Truck className="w-4 h-4 text-gray-700" />,
    colorClass: "bg-gray-50 text-gray-700 border-gray-200",
  },
  DELIVERED: {
    label: "Delivered",
    icon: <CheckCircle className="w-4 h-4 text-green-600" />,
    colorClass: "bg-green-50 text-green-700 border-green-200",
  },
  PARTIALLY_DELIVERED: {
    label: "Partially Delivered",
    icon: <Truck className="w-4 h-4 text-gray-700" />,
    colorClass: "bg-gray-50 text-gray-700 border-gray-200",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: <XCircle className="w-4 h-4 text-gray-400" />,
    colorClass: "bg-gray-50 text-gray-400 border-gray-200",
  },
  FAILED: {
    label: "Failed",
    icon: <XCircle className="w-4 h-4 text-red-500" />,
    colorClass: "bg-red-50 text-red-600 border-red-200",
  },
  RETURNED: {
    label: "Returned",
    icon: <RotateCcw className="w-4 h-4 text-gray-600" />,
    colorClass: "bg-gray-50 text-gray-600 border-gray-200",
  },
  RETURN_REQUESTED: {
    label: "Return Requested",
    icon: <RotateCcw className="w-4 h-4 text-amber-600" />,
    colorClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  ON_HOLD: {
    label: "On Hold",
    icon: <PauseCircle className="w-4 h-4 text-yellow-600" />,
    colorClass: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
};

const STATUS_OPTIONS = (Object.keys(STATUS_CONFIG) as OrderStatus[]).map(
  (s) => ({ value: s, label: STATUS_CONFIG[s].label }),
);

const taka = (n: number) =>
  `৳${Number(n).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const LIMIT = 5;

const OrderHistoryPage = () => {
  const router = useRouter();
  const axiosSecure = useAxiosSecure();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "">("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { orders, isLoading } = useOrders({
    page,
    limit: LIMIT,
    search: search || undefined,
    status: filterStatus || undefined,
  });

  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const handleSearch = (v: string) => {
    setSearch(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  };

  const list = (orders?.data ?? []) as FullOrder[];
  const meta = orders?.meta ?? { total: 0, page: 1, limit: LIMIT, totalPages: 1 };

  const handleDownloadInvoice = async (order: FullOrder) => {
    if (!order.invoice?.id) return;
    setDownloadingId(order.id);
    try {
      const res = await axiosSecure.get(`/invoices/${order.invoice.id}/pdf`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-medium mb-1.5 tracking-tight text-gray-900">
          Order History
        </h1>
        <p className="text-sm text-gray-500">
          View and manage your past orders
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, AWB, or phone..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 placeholder:text-gray-400"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center sm:justify-start text-gray-700"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <label className="block text-xs font-medium mb-3 text-gray-700 uppercase tracking-wide">
              Order Status
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setFilterStatus("");
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === ""
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                All
              </button>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFilterStatus(opt.value);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterStatus === opt.value
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-3 mb-8">
        {isLoading ? (
          <div className="text-center py-16 border border-gray-200 rounded-lg bg-white">
            <p className="text-gray-500 text-sm">Loading your orders…</p>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 border border-gray-200 rounded-lg bg-white">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-900 text-sm font-medium">No orders found</p>
            <p className="text-gray-500 text-xs mt-1">
              {search || filterStatus
                ? "Try adjusting your search or filters"
                : "You haven't placed any orders yet"}
            </p>
          </div>
        ) : (
          list.map((order) => {
            const cfg = STATUS_CONFIG[order.status];
            const canReturn = ["DELIVERED", "PARTIALLY_DELIVERED"].includes(
              order.status,
            );
            const itemCount =
              order.itemCount ??
              order.items.reduce((s, i) => s + i.quantity, 0);

            return (
              <div
                key={order.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors bg-white"
              >
                <div className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-2">
                        {cfg.icon}
                        <h3 className="font-medium text-base text-gray-900">
                          {order.orderId}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-medium border ${cfg.colorClass}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>{fmtDate(order.createdAt)}</p>
                        <p>
                          {itemCount} {itemCount === 1 ? "item" : "items"} · {taka(order.total)}
                        </p>
                        {order.awbNumber && (
                          <p className="font-mono">AWB: {order.awbNumber}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/customer/order-tracking?orderId=${order.orderId}`,
                          )
                        }
                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-gray-700"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Track
                      </button>
                      {canReturn && (
                        <button
                          onClick={() =>
                            router.push(`/refund?orderId=${order.orderId}`)
                          }
                          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-gray-700"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Return
                        </button>
                      )}
                      {order.invoice?.id && (
                        <button
                          onClick={() => handleDownloadInvoice(order)}
                          disabled={downloadingId === order.id}
                          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-gray-700 disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {downloadingId === order.id ? "..." : "Invoice"}
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setExpandedOrder(
                            expandedOrder === order.id ? null : order.id,
                          )
                        }
                        className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                      >
                        Details
                        {expandedOrder === order.id ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-5 md:p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 text-sm text-gray-900">
                          Items Ordered
                        </h4>
                        <div className="space-y-2">
                          {order.items.map((item) => {
                            const image = (item.product as any)?.images?.[0]
                              ?.image;
                            return (
                              <div
                                key={item.id}
                                className="flex gap-3 bg-white p-3 rounded-lg border border-gray-200"
                              >
                                <div className="w-14 h-14 bg-gray-50 rounded flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                                  {image ? (
                                    <img
                                      src={image}
                                      alt={item.productTitle}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="w-6 h-6 text-gray-300" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-xs text-gray-900 leading-relaxed">
                                    {item.productTitle}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Qty: {item.quantity}
                                  </p>
                                  <p className="text-xs font-medium mt-1 text-gray-900">
                                    {taka(item.priceAtPurchase)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3 text-sm text-gray-900">
                          Order Information
                        </h4>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3 text-xs">
                          <div>
                            <p className="text-gray-500 mb-1">
                              Delivery Address
                            </p>
                            <p className="font-medium text-gray-900">
                              {order.shippingAddress}
                            </p>
                            {order.districtName && (
                              <p className="text-gray-500 mt-0.5">
                                {order.districtName}
                              </p>
                            )}
                          </div>
                          <div className="pt-3 border-t border-gray-200">
                            {(order.discount ?? 0) > 0 && (
                              <div className="flex justify-between mb-2">
                                <span className="text-gray-500">Discount</span>
                                <span className="text-green-600">
                                  − {taka(order.discount ?? 0)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-500">Delivery</span>
                              <span className="text-gray-900">
                                {order.deliveryCharge
                                  ? taka(order.deliveryCharge)
                                  : "Free"}
                              </span>
                            </div>
                            <div className="flex justify-between font-medium text-sm pt-2 border-t border-gray-200">
                              <span className="text-gray-900">Total</span>
                              <span className="text-gray-900">
                                {taka(order.total)}
                              </span>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-gray-200">
                            <span className="text-gray-500">
                              Payment Status:{" "}
                            </span>
                            <span className="font-medium text-gray-900">
                              {order.paymentStatus}
                            </span>
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
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg transition-colors text-sm ${
                    page === p
                      ? "bg-gray-900 text-white"
                      : "border border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
          >
            Next
          </button>
        </div>
      )}

      {/* Results Summary */}
      {list.length > 0 && (
        <div className="text-center mt-4 text-xs text-gray-500">
          Showing {(meta.page - 1) * meta.limit + 1}–
          {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} orders
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
