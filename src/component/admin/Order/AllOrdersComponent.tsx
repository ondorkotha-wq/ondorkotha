/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import useOrders, {
  FullOrder,
  FraudStatus,
  OrderStatus,
  PaymentStatus,
} from "@/hooks/Order/useOrders";
import {
  useCheckFraud,
  useFraudHistory,
  useUpdateFraudStatus,
  type FraudHistoryRecord,
} from "@/hooks/Admin/useFraud";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import toast from "react-hot-toast";
import {
  Package,
  Printer,
  ChevronDown,
  MoreHorizontal,
  CheckCircle2,
  Truck,
  Clock,
  RotateCcw,
  Ban,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  ShieldX,
  RefreshCw,
  XCircle,
  PauseCircle,
  AlertTriangle,
  Phone,
} from "lucide-react";

import {
  Badge,
  StatCard,
  SearchBar,
  FilterSelect,
  DateRangePicker,
  RefreshButton,
  ClearFiltersButton,
  AdminTable,
  MetaPagination,
  DetailDrawer,
  DrawerSection,
  DrawerRow,
  PageHeader,
} from "@/component/Shared/Admin/AdminUI/AdminUI";
import useTrackOrder from "@/hooks/Track/useTrack";
import { useRouter } from "next/navigation";
import OrderFulfillmentModal from "./Fulfillment/OrderFulfillmentModal";
import { ClipboardList } from "lucide-react";
import { useHasPermission } from "@/context/PermissionsContext";

// ── Status configs ─────────────────────────────────────────────────────────────
const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; color: string; dot: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Pending",
    color: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    icon: <Clock className="w-3 h-3" />,
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  PACKED: {
    label: "Packed",
    color: "bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
    icon: <Package className="w-3 h-3" />,
  },
  SHIPPED: {
    label: "Shipped",
    color: "bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
    icon: <Truck className="w-3 h-3" />,
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-50 text-red-700",
    dot: "bg-red-500",
    icon: <Ban className="w-3 h-3" />,
  },
  RETURNED: {
    label: "Returned",
    color: "bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    icon: <RotateCcw className="w-3 h-3" />,
  },
  PROCESSING: {
    label: "Processing",
    color: "bg-blue-50 text-blue-700",
    dot: "bg-blue-400",
    icon: <RefreshCw className="w-3 h-3" />,
  },
  FAILED: {
    label: "Failed",
    color: "bg-red-100 text-red-800",
    dot: "bg-red-600",
    icon: <XCircle className="w-3 h-3" />,
  },
  ON_HOLD: {
    label: "On Hold",
    color: "bg-yellow-50 text-yellow-700",
    dot: "bg-yellow-500",
    icon: <PauseCircle className="w-3 h-3" />,
  },
  PARTIALLY_DELIVERED: {
    label: "Partially Delivered",
    color: "bg-teal-50 text-teal-700",
    dot: "bg-teal-400",
    icon: <Truck className="w-3 h-3" />,
  },
  RETURN_REQUESTED: {
    label: "Return Requested",
    color: "bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
    icon: <RotateCcw className="w-3 h-3" />,
  },
};

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; color: string }> =
  {
    PENDING: { label: "Pending", color: "bg-slate-100 text-slate-600" },
    PROCESSING: { label: "Processing", color: "bg-blue-50 text-blue-700" },
    PAID: { label: "Paid", color: "bg-emerald-50 text-emerald-700" },
    PARTIALLY_PAID: {
      label: "Deposit Paid",
      color: "bg-amber-50 text-amber-700",
    },
    FAILED: { label: "Failed", color: "bg-red-50 text-red-700" },
    REFUNDED: { label: "Refunded", color: "bg-orange-50 text-orange-700" },
    PARTIALLY_REFUNDED: {
      label: "Partial Ref",
      color: "bg-amber-50 text-amber-700",
    },
    CANCELLED: { label: "Cancelled", color: "bg-red-50 text-red-700" },
    EXPIRED: { label: "Expired", color: "bg-slate-100 text-slate-500" },
    ON_HOLD: { label: "On Hold", color: "bg-yellow-50 text-yellow-700" },
  };

const FRAUD_STATUS: Record<
  FraudStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  SAFE: {
    label: "Safe",
    color: "bg-emerald-50 text-emerald-700",
    icon: <ShieldCheck className="w-3 h-3" />,
  },
  SUSPICIOUS: {
    label: "Suspicious",
    color: "bg-amber-50 text-amber-700",
    icon: <ShieldAlert className="w-3 h-3" />,
  },
  DOUBTFUL: {
    label: "Doubtful",
    color: "bg-orange-50 text-orange-700",
    icon: <ShieldQuestion className="w-3 h-3" />,
  },
  BLOCKED: {
    label: "Blocked",
    color: "bg-red-50 text-red-700",
    icon: <ShieldX className="w-3 h-3" />,
  },
};

function FraudBadge({ status }: { status: FraudStatus | null | undefined }) {
  if (!status) return <span className="text-[10px] text-slate-300">—</span>;
  const cfg = FRAUD_STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

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

// ── Status flow for the mini timeline ─────────────────────────────────────────
const STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
];

// ── OrderStatusTimeline ───────────────────────────────────────────────────────
function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  const isSpecial = [
    "CANCELLED",
    "RETURNED",
    "RETURN_REQUESTED",
    "FAILED",
    "ON_HOLD",
  ].includes(status);
  const flow = isSpecial ? (["PENDING", status] as OrderStatus[]) : STATUS_FLOW;
  const currentIdx = flow.indexOf(status);

  return (
    <div className="flex items-center gap-0">
      {flow.map((s, i) => {
        const cfg = ORDER_STATUS[s];
        const done = i <= currentIdx;
        const current = s === status;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                  current
                    ? "border-[#0f172a] bg-[#0f172a]"
                    : done
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                {current ? (
                  <span className="text-white w-3 h-3">{cfg.icon}</span>
                ) : done ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full bg-slate-200`} />
                )}
              </div>
              <p
                className={`text-[8px] font-bold uppercase text-center leading-tight max-w-[44px] ${
                  current
                    ? "text-[#0f172a]"
                    : done
                      ? "text-emerald-600"
                      : "text-slate-300"
                }`}
              >
                {cfg.label}
              </p>
            </div>
            {i < flow.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-4 min-w-[12px] ${
                  i < currentIdx ? "bg-emerald-300" : "bg-slate-100"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── StatusChangeDropdown ──────────────────────────────────────────────────────
function StatusDropdown({
  orderId,
  currentStatus,
  onChanged,
  manualStatusEnabled,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  onChanged: () => void;
  manualStatusEnabled: boolean;
}) {
  const axiosSecure = useAxiosSecure();
  const canUpdateStatus = useHasPermission("ORDER_UPDATE_STATUS");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pickGate, setPickGate] = useState<{
    isFullyPicked: boolean;
    pickedCount: number;
    requiredCount: number;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lazy — only fetched when the dropdown is actually opened, so a full
  // order table doesn't fire one shipment-group request per row on mount.
  useEffect(() => {
    if (!open) return;
    axiosSecure
      .get(`/reservations/orders/${orderId}/shipment-group`)
      .then(({ data }) => setPickGate(data))
      .catch(() => setPickGate(null));
  }, [open, orderId, axiosSecure]);

  const statuses = Object.keys(ORDER_STATUS) as OrderStatus[];

  const isShippedBlocked = (status: OrderStatus) =>
    status === "SHIPPED" &&
    !!pickGate &&
    pickGate.requiredCount > 0 &&
    !pickGate.isFullyPicked;

  const handleChange = async (status: OrderStatus) => {
    if (status === currentStatus) {
      setOpen(false);
      return;
    }
    if (isShippedBlocked(status)) {
      toast.error(
        `Only ${pickGate!.pickedCount}/${pickGate!.requiredCount} piece(s) picked — can't ship yet`,
      );
      return;
    }
    setLoading(true);
    try {
      await axiosSecure.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${ORDER_STATUS[status].label}`);
      onChanged();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to update status");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const cfg = ORDER_STATUS[currentStatus];

  if (!manualStatusEnabled || !canUpdateStatus) {
    return (
      <span
        title={
          !canUpdateStatus
            ? undefined
            : "Status is driven by the courier webhook — manual changes are disabled"
        }
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide cursor-not-allowed ${cfg.color}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-slate-300 transition-all ${cfg.color}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-xl z-30 py-1.5 min-w-[160px] overflow-hidden">
          {statuses.map((s) => {
            const c = ORDER_STATUS[s];
            const blocked = isShippedBlocked(s);
            return (
              <button
                key={s}
                onClick={() => handleChange(s)}
                disabled={blocked}
                title={
                  blocked
                    ? `${pickGate!.pickedCount}/${pickGate!.requiredCount} piece(s) picked — use Fulfillment to finish picking first`
                    : undefined
                }
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 transition-colors text-left ${
                  s === currentStatus || blocked
                    ? "opacity-40 cursor-not-allowed"
                    : ""
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                <span className="font-medium text-slate-700">{c.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Order Detail Drawer ───────────────────────────────────────────────────────
function OrderDetailDrawer({
  orderId,
  onClose,
  onRefresh,
  manualStatusEnabled,
}: {
  orderId: string;
  onClose: () => void;
  onRefresh: () => void;
  manualStatusEnabled: boolean;
}) {
  const axiosSecure = useAxiosSecure();
  const router = useRouter();
  const canUpdateStatus = useHasPermission("ORDER_UPDATE_STATUS");
  const canManageCourier = useHasPermission("COURIER_MANAGE");

  const { order, isLoading, refetch } = useTrackOrder({
    trackingId: orderId,
    details: true,
  });

  const [collectingRemainder, setCollectingRemainder] = useState(false);
  const [collectedBy, setCollectedBy] = useState("");
  const [submittingRemainder, setSubmittingRemainder] = useState(false);
  const [showFulfillment, setShowFulfillment] = useState(false);
  const [pickGate, setPickGate] = useState<{
    isFullyPicked: boolean;
    pickedCount: number;
    requiredCount: number;
  } | null>(null);

  useEffect(() => {
    if (!order?.orderNumber) return;
    axiosSecure
      .get(`/reservations/orders/${order.orderNumber}/shipment-group`)
      .then(({ data }) => setPickGate(data))
      .catch(() => setPickGate(null));
  }, [order?.orderNumber, axiosSecure]);

  const isShippedBlocked = (s: OrderStatus) =>
    s === "SHIPPED" &&
    !!pickGate &&
    pickGate.requiredCount > 0 &&
    !pickGate.isFullyPicked;

  const handleCollectRemainder = async () => {
    if (!order || !collectedBy.trim()) {
      toast.error("Please enter who collected the payment");
      return;
    }
    setSubmittingRemainder(true);
    try {
      await axiosSecure.patch(
        `/orders/${order.orderNumber}/collect-remainder`,
        { collectedBy: collectedBy.trim() },
      );
      toast.success("Remainder collected — order marked as paid");
      setCollectingRemainder(false);
      setCollectedBy("");
      refetch();
      onRefresh();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ?? "Failed to collect remainder",
      );
    } finally {
      setSubmittingRemainder(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!order) return;
    const invoiceId = order.invoiceId;
    if (!invoiceId) {
      toast.error("No invoice found for this order");
      return;
    }
    window.open(`/dashboard/invoice/${invoiceId}?autoprint=1`, "_blank");
  };

  const createShipment = (orderId?: string) => {
    router.push(`/admin/courier?orderId=${orderId}`);
  };

  return (
    <DetailDrawer
      open={!!orderId}
      onClose={onClose}
      title={order?.orderNumber ?? "Loading…"}
      subtitle={order ? fmtDateTime(order.orderDate) : undefined}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFulfillment(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Fulfillment
          </button>
          {canManageCourier && (
            <button
              onClick={() => createShipment(order?.orderNumber)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Truck className="w-3.5 h-3.5" />
              Create Shipment
            </button>
          )}
        </div>
      }
    >
      {showFulfillment && order && (
        <OrderFulfillmentModal
          orderId={order.orderNumber}
          items={order.items}
          onClose={() => {
            setShowFulfillment(false);
            refetch();
          }}
        />
      )}
      {isLoading || !order ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
      ) : (
        <>
          {/* Out-of-stock alert */}
          {order.hasOutOfStockItem && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 w-5 h-5 shrink-0 text-red-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700">
                  Out of stock —{" "}
                  {order.items.filter((i) => i.isOutOfStock).length} item(s)
                  in this order can&apos;t be fulfilled
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-red-600">
                  {order.items
                    .filter((i) => i.isOutOfStock)
                    .map((item) => (
                      <li key={item.id}>
                        {item.name}
                        {[item.color, item.size].filter(Boolean).length >
                          0 &&
                          ` (${[item.color, item.size].filter(Boolean).join(" / ")})`}
                      </li>
                    ))}
                </ul>
                <a
                  href={`tel:${order.shippingAddress.phone}`}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call {order.shippingAddress.name}
                </a>
              </div>
            </div>
          )}

          {/* Status timeline */}
          <DrawerSection title="Order Progress">
            <div className="py-2">
              <OrderStatusTimeline status={order.status} />
            </div>
          </DrawerSection>

          {/* Status controls */}
          <DrawerSection title="Change Status">
            {!manualStatusEnabled ? (
              <p className="pt-1 text-xs text-slate-400">
                Manual status changes are disabled — status updates come
                automatically from the courier webhook.
              </p>
            ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => {
                const cfg = ORDER_STATUS[s];
                const isCurrent = order.status === s;
                const blocked = isShippedBlocked(s);
                return (
                  <button
                    key={s}
                    disabled={isCurrent || blocked}
                    title={
                      blocked
                        ? `${pickGate!.pickedCount}/${pickGate!.requiredCount} piece(s) picked — use Fulfillment to finish picking first`
                        : undefined
                    }
                    onClick={async () => {
                      if (blocked) {
                        toast.error(
                          `Only ${pickGate!.pickedCount}/${pickGate!.requiredCount} piece(s) picked — can't ship yet`,
                        );
                        return;
                      }
                      try {
                        await axiosSecure.patch(
                          `/orders/${order.orderNumber}/status`,
                          {
                            status: s,
                          },
                        );
                        toast.success(`Status → ${cfg.label}`);
                        refetch();
                        onRefresh();
                      } catch (e: any) {
                        toast.error(
                          e?.response?.data?.message ??
                            "Failed to update status",
                        );
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${
                      isCurrent
                        ? `${cfg.color} border-current opacity-100 cursor-default`
                        : blocked
                          ? "border-slate-100 text-slate-300 cursor-not-allowed"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                    }`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            )}
          </DrawerSection>

          {/* Customer */}
          <DrawerSection title="Customer">
            <DrawerRow label="Name" value={order.shippingAddress.name} />
            <DrawerRow label="Phone" value={order.shippingAddress.phone} mono />
            <DrawerRow
              label="Address"
              value={order.shippingAddress.address}
            />
            <DrawerRow
              label="District"
              value={order.shippingAddress.district}
            />
          </DrawerSection>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <DrawerSection title="Order Items">
              <div className="space-y-2 pt-1">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-tight">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {[item.color, item.size, item.sku]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-semibold text-slate-800">
                        {taka(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </DrawerSection>
          )}

          {/* Financials */}
          <DrawerSection title="Financials" tint="slate">
            <DrawerRow
              label="Subtotal"
              value={taka(
                order.total -
                  (order.deliveryCharge ?? 0) +
                  (order.discount ?? 0),
              )}
            />
            {(order.discount ?? 0) > 0 && (
              <DrawerRow
                label="Discount"
                value={`− ${taka(order.discount ?? 0)}`}
              />
            )}
            <DrawerRow
              label="Delivery"
              value={order.deliveryCharge ? taka(order.deliveryCharge) : "Free"}
            />
            <DrawerRow label="Total" value={taka(order.total)} highlight />
            {order.advanceRequired && (
              <>
                <DrawerRow
                  label={`Deposit (${order.advancePercentage}%)`}
                  value={taka(order.advanceAmount ?? 0)}
                />
                <DrawerRow
                  label="Balance Due"
                  value={taka(order.remainingAmount ?? 0)}
                />
              </>
            )}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <DrawerRow
                label="Payment Status"
                value={
                  PAYMENT_STATUS[order.paymentStatus]?.label ??
                  order.paymentStatus
                }
              />
              {order.awbNumber && (
                <DrawerRow
                  label="AWB / Tracking"
                  value={order.awbNumber}
                  mono
                />
              )}
            </div>
          </DrawerSection>

          {/* Payments */}
          {order.payments && order.payments.length > 0 && (
            <DrawerSection title="Payment Records">
              {order.payments.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      {p.phase && p.phase !== "FULL"
                        ? `${p.phase === "ADVANCE" ? "Deposit" : "Remainder"} · ${p.method}`
                        : p.method}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {p.transactionId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-semibold text-slate-800">
                      {taka(p.amount)}
                    </p>
                    <Badge
                      label={p.status}
                      colorClass={
                        PAYMENT_STATUS[p.status as PaymentStatus]?.color ??
                        "bg-slate-100 text-slate-600"
                      }
                    />
                  </div>
                </div>
              ))}
            </DrawerSection>
          )}

          {/* Collect Remainder */}
          {canUpdateStatus &&
            order.paymentStatus === "PARTIALLY_PAID" &&
            (order.remainingAmount ?? 0) > 0 && (
              <DrawerSection title="Collect Remainder" tint="slate">
                {collectingRemainder ? (
                  <div className="space-y-2 pt-1">
                    <input
                      autoFocus
                      type="text"
                      value={collectedBy}
                      onChange={(e) => setCollectedBy(e.target.value)}
                      placeholder="Courier / staff name"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-slate-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCollectRemainder}
                        disabled={submittingRemainder}
                        className="flex-1 py-2 bg-[#0f172a] text-white text-xs font-medium rounded-lg disabled:opacity-50"
                      >
                        {submittingRemainder
                          ? "Collecting..."
                          : `Confirm ৳${order.remainingAmount} Collected`}
                      </button>
                      <button
                        onClick={() => {
                          setCollectingRemainder(false);
                          setCollectedBy("");
                        }}
                        className="px-3 py-2 border border-slate-200 text-slate-500 text-xs font-medium rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCollectingRemainder(true)}
                    className="w-full py-2.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl hover:bg-amber-100 transition-colors"
                  >
                    Collect Remainder (৳{order.remainingAmount})
                  </button>
                )}
              </DrawerSection>
            )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handlePrintInvoice}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 bg-white text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Invoice
            </button>
          </div>
        </>
      )}
    </DetailDrawer>
  );
}

// ── Fraud History Drawer ──────────────────────────────────────────────────────
function FraudHistoryDrawer({
  phone,
  onClose,
}: {
  phone: string;
  onClose: () => void;
}) {
  const { load, loading, history } = useFraudHistory();

  useEffect(() => {
    load(phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  return (
    <DetailDrawer
      open={!!phone}
      onClose={onClose}
      title="Fraud History"
      subtitle={phone}
    >
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
      ) : history.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          No fraud checks recorded for this number.
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((record: FraudHistoryRecord) => {
            const cfg = FRAUD_STATUS[record.computedStatus];
            return (
              <div
                key={record.id}
                className="border border-slate-100 rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-slate-400">
                    {fmtDateTime(record.checkedAt)}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                  <span className="text-slate-400">Risk Score</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {record.riskScore}
                  </span>
                  <span className="text-slate-400">Risk Level</span>
                  <span className="font-semibold text-slate-800">
                    {record.riskLevel}
                  </span>
                  <span className="text-slate-400">Fraud Reports</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {record.fraudReportCount}
                  </span>
                  <span className="text-slate-400">Total Orders</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {record.totalOrders}
                  </span>
                  <span className="text-slate-400">Returns</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {record.returned}
                  </span>
                  <span className="text-slate-400">Success Ratio</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {(record.successRatio * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DetailDrawer>
  );
}

// ── Row action menu ───────────────────────────────────────────────────────────
function RowMenu({
  order,
  onView,
  onRefresh,
  onViewFraudHistory,
}: {
  order: FullOrder;
  onView: () => void;
  onRefresh: () => void;
  onViewFraudHistory: (phone: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { check, loading: checkLoading } = useCheckFraud();
  const { update, loading: updateLoading } = useUpdateFraudStatus();
  const canManageFraud = useHasPermission("FRAUD_MANAGE");

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleCheckFraud = async () => {
    setOpen(false);
    if (!order.customerPhone) {
      toast.error("No phone number for this order");
      return;
    }
    try {
      const result = await check(order.customerPhone);

      // Auto-update the DB with the computed status
      if (order.user?.id) {
        await update(order.user.id, result.fraudStatus);
      }

      onRefresh();

      const cfg = FRAUD_STATUS[result.fraudStatus];
      toast(
        (t) => (
          <div className="text-xs w-64">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-slate-800">FraudSpyBD Check</p>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}
              >
                {cfg.icon}
                {cfg.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 bg-slate-50 rounded-lg p-2 mb-2">
              <span className="text-slate-500">Risk Score</span>
              <span className="font-mono font-semibold text-slate-800">
                {result.riskScore}
              </span>
              <span className="text-slate-500">Risk Level</span>
              <span className="font-semibold text-slate-800">
                {result.riskLevel}
              </span>
              <span className="text-slate-500">Fraud Reports</span>
              <span className="font-mono font-semibold text-slate-800">
                {result.fraudReports}
              </span>
              <span className="text-slate-500">Total Orders</span>
              <span className="font-mono font-semibold text-slate-800">
                {result.totalOrders}
              </span>
              <span className="text-slate-500">Returns</span>
              <span className="font-mono font-semibold text-slate-800">
                {result.returned}
              </span>
              <span className="text-slate-500">Success Ratio</span>
              <span className="font-mono font-semibold text-slate-800">
                {(result.successRatio * 100).toFixed(0)}%
              </span>
            </div>

            <p className="text-[10px] text-slate-400 mb-2">
              {order.user?.id
                ? `✓ Status saved as ${result.fraudStatus}`
                : "Guest order — no user account to update"}
            </p>

            {order.user?.id && (
              <div>
                <p className="text-[10px] text-slate-400 mb-1">
                  Override status:
                </p>
                <div className="flex gap-1 flex-wrap">
                  {(["SAFE", "DOUBTFUL", "SUSPICIOUS", "BLOCKED"] as const).map(
                    (s) => {
                      const c = FRAUD_STATUS[s];
                      return (
                        <button
                          key={s}
                          onClick={async () => {
                            toast.dismiss(t.id);
                            await update(order.user!.id, s);
                            toast.success(`Fraud status overridden → ${s}`);
                            onRefresh();
                          }}
                          disabled={updateLoading || s === result.fraudStatus}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors disabled:opacity-40 ${c.color}`}
                        >
                          {c.label}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            )}
          </div>
        ),
        { duration: 20000 },
      );
    } catch {
      toast.error("Fraud check failed");
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-20 py-1.5 min-w-40 overflow-hidden">
          <button
            onClick={() => {
              onView();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
          >
            View Details
          </button>
          {canManageFraud && (
            <button
              onClick={handleCheckFraud}
              disabled={checkLoading}
              className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3 h-3 ${checkLoading ? "animate-spin" : ""}`}
              />
              Check Fraud
            </button>
          )}
          {canManageFraud && (
            <button
              onClick={() => {
                if (order.customerPhone) {
                  onViewFraudHistory(order.customerPhone);
                }
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
            >
              <ShieldAlert className="w-3 h-3" />
              Fraud History
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const LIMIT = 20;

const ORDER_STATUS_OPTIONS = (Object.keys(ORDER_STATUS) as OrderStatus[]).map(
  (s) => ({ label: ORDER_STATUS[s].label, value: s }),
);

export default function AllOrdersComponent() {
  const axiosSecure = useAxiosSecure();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [fraudHistoryPhone, setFraudHistoryPhone] = useState<string | null>(
    null,
  );
  // Off by default (MANUAL_ORDER_STATUS_UPDATE env flag) — status is meant
  // to come from the courier webhook, so keep the controls disabled until
  // we know the backend has manual updates turned on.
  const [manualStatusEnabled, setManualStatusEnabled] = useState(false);

  useEffect(() => {
    axiosSecure
      .get("/orders/manual-status-enabled")
      .then(({ data }) => setManualStatusEnabled(!!data?.enabled))
      .catch(() => setManualStatusEnabled(false));
  }, [axiosSecure]);

  const {
    orders,
    isLoading,
    // meta, statusCounts, loading,
    refetch,
  } = useOrders({
    page,
    limit: LIMIT,
    search: search || undefined,
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  // Debounce search
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const handleSearch = (v: string) => {
    setSearch(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const hasFilters = !!(search || status || from || to);

  const typedOrders = (orders?.data ?? []) as FullOrder[];
  const typedMeta = orders?.meta ?? {
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
  };

  // Build status summary from statusCounts
  const topStats = [
    { label: "Total", value: typedMeta.total },
    { label: "Pending", value: orders?.statusCounts?.PENDING ?? 0 },
    { label: "Shipped", value: orders?.statusCounts?.SHIPPED ?? 0 },
    { label: "Delivered", value: orders?.statusCounts?.DELIVERED ?? 0 },
  ];

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <PageHeader title="All Orders">
        <div className="hidden md:flex items-center gap-4">
          {orders?.statusCounts?.PENDING && orders.statusCounts.PENDING > 0 && (
            <div className="text-right">
              <p className="text-lg font-bold font-mono text-amber-600">
                {orders.statusCounts.PENDING}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                Pending
              </p>
            </div>
          )}
        </div>
      </PageHeader>

      <div className="max-w-350 mx-auto px-8 py-6 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topStats.map((s, i) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              accent={i === 0}
            />
          ))}
        </div>

        {/* Status pill tabs */}
        {orders?.statusCounts && (
          <div className="flex gap-1.5 flex-wrap bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm">
            <TabPill
              label="All"
              count={typedMeta.total}
              active={status === ""}
              onClick={() => {
                setStatus("");
                setPage(1);
              }}
            />
            {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => {
              const count = orders?.statusCounts?.[s] ?? 0;
              if (count === 0) return null;
              return (
                <TabPill
                  key={s}
                  label={ORDER_STATUS[s].label}
                  count={count}
                  active={status === s}
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                  }}
                  dot={ORDER_STATUS[s].dot}
                />
              );
            })}
          </div>
        )}

        {/* Filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Search name, phone, order ID…"
            className="flex-1 min-w-55"
          />
          <FilterSelect
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={ORDER_STATUS_OPTIONS}
            placeholder="All Statuses"
          />
          <DateRangePicker
            from={from}
            to={to}
            onFromChange={(v) => {
              setFrom(v);
              setPage(1);
            }}
            onToChange={(v) => {
              setTo(v);
              setPage(1);
            }}
          />
          {hasFilters && <ClearFiltersButton onClick={clearFilters} />}
          <RefreshButton onClick={() => refetch()} loading={isLoading} />
        </div>

        {/* Table */}
        <AdminTable
          headers={[
            "Order",
            "Customer",
            "Items",
            "Total",
            "Order Status",
            "Payment",
            "Fraud",
            "Date",
            "",
          ]}
          loading={isLoading}
          empty={typedOrders.length === 0}
          emptyAction={
            hasFilters ? (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            ) : undefined
          }
        >
          {typedOrders.map((order) => (
            <tr
              key={order.id}
              className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              onClick={() => setDetailId(order.orderId)}
            >
              {/* Order ID */}
              <td className="px-5 py-3.5">
                <p className="font-mono text-xs font-semibold text-slate-800 group-hover:text-[#0f172a]">
                  {order.orderId}
                </p>
                {order.awbNumber && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    AWB: {order.awbNumber}
                  </p>
                )}
                {order.hasOutOfStockItem && (
                  <div
                    className="flex items-center gap-1 mt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-600">
                      <AlertTriangle className="w-3 h-3" />
                      Stock issue
                    </span>
                    <a
                      href={`tel:${order.customerPhone}`}
                      title={`Call ${order.customerPhone}`}
                      className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </td>

              {/* Customer */}
              <td className="px-4 py-3.5">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {order.customerName}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {order.customerPhone}
                </p>
                {order.districtName && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {order.districtName}
                  </p>
                )}
              </td>

              {/* Items count */}
              <td className="px-4 py-3.5">
                <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                  {order.itemCount ??
                    order.items?.reduce((s, i) => s + i.quantity, 0) ??
                    "—"}{" "}
                  pcs
                </span>
              </td>

              {/* Total */}
              <td className="px-4 py-3.5">
                <p className="text-sm font-mono font-bold text-slate-900">
                  {taka(order.total)}
                </p>
                {(order.discount ?? 0) > 0 && (
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    − {taka(order.discount ?? 0)} off
                  </p>
                )}
              </td>

              {/* Status (clickable dropdown, stop propagation) */}
              <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                <StatusDropdown
                  orderId={order.orderId}
                  currentStatus={order.status}
                  onChanged={refetch}
                  manualStatusEnabled={manualStatusEnabled}
                />
              </td>

              {/* Payment status */}
              <td className="px-4 py-3.5">
                <Badge
                  label={
                    PAYMENT_STATUS[order.paymentStatus]?.label ??
                    order.paymentStatus
                  }
                  colorClass={
                    PAYMENT_STATUS[order.paymentStatus]?.color ??
                    "bg-slate-100 text-slate-600"
                  }
                />
              </td>

              {/* Fraud status */}
              <td className="px-4 py-3.5">
                <FraudBadge status={order.user?.fraudStatus} />
              </td>

              {/* Date */}
              <td className="px-4 py-3.5">
                <p className="text-xs text-slate-500">
                  {fmtDate(order.createdAt)}
                </p>
              </td>

              {/* Action menu */}
              <td
                className="px-4 py-3.5 pr-5"
                onClick={(e) => e.stopPropagation()}
              >
                <RowMenu
                  order={order}
                  onView={() => setDetailId(order.orderId)}
                  onRefresh={refetch}
                  onViewFraudHistory={(phone) => setFraudHistoryPhone(phone)}
                />
              </td>
            </tr>
          ))}
        </AdminTable>

        {/* Pagination */}
        <MetaPagination
          meta={typedMeta}
          page={page}
          onPageChange={setPage}
          limit={LIMIT}
        />
      </div>

      {/* Detail Drawer */}
      {detailId && (
        <OrderDetailDrawer
          orderId={detailId}
          onClose={() => setDetailId(null)}
          onRefresh={refetch}
          manualStatusEnabled={manualStatusEnabled}
        />
      )}

      {/* Fraud History Drawer */}
      {fraudHistoryPhone && (
        <FraudHistoryDrawer
          phone={fraudHistoryPhone}
          onClose={() => setFraudHistoryPhone(null)}
        />
      )}
    </div>
  );
}

// ── TabPill ───────────────────────────────────────────────────────────────────
function TabPill({
  label,
  count,
  active,
  onClick,
  dot,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
        active
          ? "bg-[#0f172a] text-white shadow-sm"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
      }`}
    >
      {dot && !active && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {label}
      <span
        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
