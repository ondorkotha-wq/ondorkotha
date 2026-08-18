"use client";

/**
 * OrderShipments — drop this inside your order detail page.
 *
 * Usage:
 *   <OrderShipments orderId={order.id} providers={providers} />
 */

import React, { useCallback, useEffect, useState } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import toast from "react-hot-toast";
import {
  Truck,
  RefreshCw,
  Plus,
  XCircle,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type CourierStatus =
  | "PENDING"
  | "BOOKED"
  | "PICKUP_ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "PARTIALLY_DELIVERED"
  | "RETURNED"
  | "CANCELLED"
  | "ON_HOLD"
  | "FAILED";

interface Shipment {
  id: number;
  consignmentId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: CourierStatus;
  providerStatus?: string;
  codAmount?: number;
  deliveryCharge?: number;
  errorMessage?: string;
  createdAt: string;
  lastSyncAt?: string;
  deliveredAt?: string;
  provider: { id: number; name: string; displayName: string; logo?: string };
}

interface Provider {
  id: number;
  name: string;
  displayName: string;
  logo?: string;
  isActive: boolean;
}

const STATUS_CONFIG: Record<
  CourierStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING:            { label: "Pending",          bg: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400" },
  BOOKED:             { label: "Booked",            bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500" },
  PICKUP_ASSIGNED:    { label: "Pickup Assigned",   bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500" },
  PICKED_UP:          { label: "Picked Up",         bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-500" },
  IN_TRANSIT:         { label: "In Transit",        bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  OUT_FOR_DELIVERY:   { label: "Out for Delivery",  bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500 animate-pulse" },
  DELIVERED:          { label: "Delivered",         bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  PARTIALLY_DELIVERED:{ label: "Partial",           bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-400" },
  RETURNED:           { label: "Returned",          bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500" },
  CANCELLED:          { label: "Cancelled",         bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500" },
  ON_HOLD:            { label: "On Hold",           bg: "bg-yellow-50",  text: "text-yellow-700",  dot: "bg-yellow-500" },
  FAILED:             { label: "Failed",            bg: "bg-red-100",    text: "text-red-800",     dot: "bg-red-600" },
};

const taka = (n: number) => `৳ ${Number(n).toLocaleString("en-BD")}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const StatusBadge = ({ status }: { status: CourierStatus }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── Tracking Timeline ─────────────────────────────────────────────────────────
const statusFlow: CourierStatus[] = [
  "BOOKED",
  "PICKUP_ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const TrackingTimeline = ({ status }: { status: CourierStatus }) => {
  const isSpecial = ["CANCELLED", "RETURNED", "FAILED", "ON_HOLD"].includes(
    status,
  );
  const flow = isSpecial ? ["BOOKED", status] : statusFlow;
  const currentIdx = flow.indexOf(status);

  return (
    <div className="flex items-center gap-0 w-full">
      {flow.map((s, i) => {
        const done = i < currentIdx || s === status;
        const current = s === status;
        const cfg = STATUS_CONFIG[s as CourierStatus];
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                  current
                    ? `border-current ${cfg.dot.replace("animate-pulse", "")} bg-opacity-20 border-opacity-80`
                    : done
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                {done && !current ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : current ? (
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`}
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-200" />
                )}
              </div>
              <p
                className={`text-[9px] font-medium text-center leading-tight max-w-[56px] ${
                  current ? cfg.text : done ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {cfg?.label ?? s}
              </p>
            </div>
            {i < flow.length - 1 && (
              <div
                className={`flex-1 h-0.5 mt-[-10px] ${
                  i < currentIdx ? "bg-emerald-300" : "bg-slate-100"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Book Widget ───────────────────────────────────────────────────────────────
const BookWidget: React.FC<{
  orderId: number;
  providers: Provider[];
  onBook: () => void;
}> = ({ orderId, providers, onBook }) => {
  const axiosSecure = useAxiosSecure();
  const [providerId, setProviderId] = useState<number | "">("");
  const [weight, setWeight] = useState(1);
  const [loading, setLoading] = useState(false);

  const active = providers.filter((p) => p.isActive);

  const handleBook = async () => {
    if (!providerId) { toast.error("Select a provider"); return; }
    setLoading(true);
    try {
      await axiosSecure.post("/courier/shipments/book", {
        orderId,
        providerId: Number(providerId),
        weight,
      });
      toast.success("Shipment booked!");
      onBook();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
        Book with Courier
      </p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
            Provider
          </label>
          <select
            value={providerId}
            onChange={(e) => setProviderId(Number(e.target.value) || "")}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
          >
            <option value="">— Select —</option>
            {active.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
            Weight (kg)
          </label>
          <input
            type="number"
            value={weight}
            min={0.1}
            step={0.1}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
          />
        </div>
      </div>
      <button
        onClick={handleBook}
        disabled={loading || !providerId}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0f172a] text-white text-sm font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Zap className="w-4 h-4" />
        )}
        {loading ? "Booking..." : "Book Shipment"}
      </button>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function OrderShipments({
  orderId,
  providers = [],
}: {
  orderId: number;
  providers?: Provider[];
}) {
  const axiosSecure = useAxiosSecure();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axiosSecure.get(`/courier/orders/${orderId}/shipments`);
      setShipments(r.data);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure, orderId]);

  useEffect(() => { load(); }, [load]);

  const handleSync = async (id: number) => {
    setSyncing(id);
    try {
      await axiosSecure.post(`/courier/shipments/${id}/sync`);
      toast.success("Synced");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Sync failed");
    } finally {
      setSyncing(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this shipment?")) return;
    try {
      await axiosSecure.post(`/courier/shipments/${id}/cancel`);
      toast.success("Cancelled");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Cancel failed");
    }
  };

  const hasActiveShipment = shipments.some(
    (s) => !["CANCELLED", "RETURNED", "FAILED"].includes(s.status),
  );

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="py-8 text-center">
          <RefreshCw className="w-5 h-5 animate-spin text-slate-300 mx-auto" />
        </div>
      ) : (
        <>
          {/* Existing shipments */}
          {shipments.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {s.provider.logo ? (
                    <img
                      src={s.provider.logo}
                      alt={s.provider.displayName}
                      className="w-8 h-8 object-contain rounded-lg border border-slate-100"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Truck className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {s.provider.displayName}
                    </p>
                    {s.consignmentId && (
                      <p className="text-[10px] font-mono text-slate-400">
                        {s.consignmentId}
                      </p>
                    )}
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>

              {/* Timeline */}
              <div className="px-6 py-5">
                <TrackingTimeline status={s.status} />
              </div>

              {/* Details */}
              <div className="grid grid-cols-3 gap-px bg-slate-100 border-t border-slate-100">
                {[
                  ["Tracking", s.trackingNumber ?? "—"],
                  ["COD", s.codAmount ? taka(s.codAmount) : "—"],
                  ["Created", fmtDate(s.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white px-5 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      {label}
                    </p>
                    <p className="text-xs font-medium text-slate-800 mt-0.5 font-mono">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Error */}
              {s.errorMessage && (
                <div className="mx-4 mb-4 mt-2 p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">{s.errorMessage}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
                {s.trackingUrl && (
                  <a
                    href={s.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-600 text-xs font-medium rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Track Parcel <ArrowRight className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={() => handleSync(s.id)}
                  disabled={syncing === s.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-600 text-xs font-medium rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${syncing === s.id ? "animate-spin" : ""}`}
                  />
                  {syncing === s.id ? "Syncing..." : "Sync"}
                </button>
                {!["DELIVERED", "CANCELLED", "RETURNED"].includes(
                  s.status,
                ) && (
                  <button
                    onClick={() => handleCancel(s.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-red-50 text-red-700 text-xs font-medium rounded-xl hover:bg-red-100 transition-colors ml-auto"
                  >
                    <XCircle className="w-3 h-3" />
                    Cancel
                  </button>
                )}
                {s.lastSyncAt && (
                  <span className="ml-auto text-[10px] text-slate-400 self-center">
                    Synced {fmtDate(s.lastSyncAt)}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Book new shipment (only if no active shipment) */}
          {!hasActiveShipment && providers.length > 0 && (
            <BookWidget
              orderId={orderId}
              providers={providers}
              onBook={load}
            />
          )}

          {shipments.length === 0 && providers.length === 0 && (
            <div className="py-10 text-center text-slate-400 text-sm">
              No courier providers configured yet.
            </div>
          )}
        </>
      )}
    </div>
  );
}