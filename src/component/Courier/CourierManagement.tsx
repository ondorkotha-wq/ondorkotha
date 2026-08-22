/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import toast from "react-hot-toast";
import {
  Truck,
  RefreshCw,
  X,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Printer,
  Settings,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { DeleteConfirmationModal } from "../admin/Modal/DeleteConfirmationModal";
import useFetchCompany from "@/hooks/Company/useFetchCompany";
import useFetchPrintingSettings from "@/hooks/Settings/useFetchPrintingSettings";
import ShipmentLabel from "./ShipmentLabel";
import { printLabelSheet } from "../admin/PrintLabels/printLabels";

// ── Types ─────────────────────────────────────────────────────────────────────
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

interface Provider {
  id: number;
  name: string;
  displayName: string;
  logo?: string;
  isActive: boolean;
  priority: number;
  config: Record<string, any>;
}

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
  weight?: number;
  itemDescription?: string;
  special_instruction?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  provider: { id: number; name: string; displayName: string; logo?: string };
  order: {
    id: number;
    orderId: string;
    customerName: string;
    customerPhone: string;
    total: number;
    status: string;
    shippingAddress?: string;
    districtName?: string;
    zoneName?: string;
    areaName?: string;
    postCode?: string;
  };
}

type Tab = "shipments" | "providers";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  CourierStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
  BOOKED: {
    label: "Booked",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  PICKUP_ASSIGNED: {
    label: "Pickup Assigned",
    bg: "bg-violet-50",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  PICKED_UP: {
    label: "Picked Up",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
  },
  IN_TRANSIT: {
    label: "In Transit",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-500 animate-pulse",
  },
  DELIVERED: {
    label: "Delivered",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  PARTIALLY_DELIVERED: {
    label: "Partial Delivered",
    bg: "bg-teal-50",
    text: "text-teal-700",
    dot: "bg-teal-400",
  },
  RETURNED: {
    label: "Returned",
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  ON_HOLD: {
    label: "On Hold",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
  FAILED: {
    label: "Failed",
    bg: "bg-red-100",
    text: "text-red-800",
    dot: "bg-red-600",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const taka = (n: number) =>
  `৳ ${Number(n).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const StatusBadge = ({ status }: { status: CourierStatus }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── Book Shipment Modal ───────────────────────────────────────────────────────
const BookModal: React.FC<{
  providers: Provider[];
  onClose: () => void;
  onBook: (data: any) => Promise<void>;
  initialOrderId?: string;
}> = ({ providers, onClose, onBook, initialOrderId = "" }) => {
  const axiosSecure = useAxiosSecure();

  const [orderNumber, setOrderNumber] = useState(initialOrderId);
  const [orderId, setOrderId] = useState(null);
  const [providerId, setProviderId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [pickGate, setPickGate] = useState<{
    isFullyPicked: boolean;
    pickedCount: number;
    requiredCount: number;
  } | null>(null);
  const [pickGateLoading, setPickGateLoading] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  const [form, setForm] = useState({
    recipientName: "",
    recipientPhone: "",
    recipientAddress: "",
    weight: 0.5,
    codAmount: 0,
    itemDescription: "",
    special_instruction: "",
    deliveryType: "48",
    itemType: "2",
  });

  const activeProviders = providers.filter((p) => p.isActive);

  // Auto-fetch order when initialOrderId is set
  useEffect(() => {
    if (initialOrderId) fetchOrder(initialOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderId]);

  const fetchOrder = async (id: string) => {
    if (!id) return;
    setFetching(true);
    setPickGate(null);
    setBookError(null);
    try {
      const r = await axiosSecure.get(`/orders/track/${id}`);
      console.log(r.data, "couriodata");
      const o = r.data;

      console.log(o, "data");
      setOrderId(o.id);
      setOrderInfo(o);
      setPickGateLoading(true);
      axiosSecure
        .get(`/reservations/orders/${o.id}/shipment-group`)
        .then(({ data }) => setPickGate(data))
        .catch(() => setPickGate(null))
        .finally(() => setPickGateLoading(false));
      setForm((prev) => ({
        ...prev,
        recipientName: o.shippingAddress?.name ?? o.customerName ?? "",
        recipientPhone: o.shippingAddress?.phone ?? o.customerPhone ?? "",
        recipientAddress: [
          o.shippingAddress?.address,
          o.shippingAddress?.district,
        ]
          .filter(Boolean)
          .join(", "),
        codAmount: o.total ?? 0,
        itemDescription:
          o.items
            ?.map(
              (i: any) =>
                `${i.name}${i.size ? ` (${i.size})` : ""} x${i.quantity}`,
            )
            .join(", ") ?? "",
        weight: Math.max(
          0.5,
          (o.items?.reduce((s: number, i: any) => s + i.quantity, 0) ?? 1) *
            0.3,
        ),
      }));
    } catch {
      toast.error("Order not found");
      setOrderInfo(null);
    } finally {
      setFetching(false);
    }
  };

  const set = (key: string, val: any) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const pickBlocked =
    !!pickGate && pickGate.requiredCount > 0 && !pickGate.isFullyPicked;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Book Shipment
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Send order to courier partner
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Order lookup */}
          <div>
            <Field label="Order ID">
              <div className="flex gap-2">
                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="ORD-20260302-..."
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                  onKeyDown={(e) =>
                    e.key === "Enter" && fetchOrder(orderNumber)
                  }
                />
                <button
                  type="button"
                  onClick={() => fetchOrder(orderNumber)}
                  disabled={fetching || !orderNumber}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shrink-0"
                >
                  {fetching ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  {fetching ? "Fetching…" : "Fetch"}
                </button>
              </div>
            </Field>

            {/* Order info banner */}
            {orderInfo && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div className="text-xs text-emerald-800">
                  <p className="font-semibold">
                    {orderInfo.customerName ?? orderInfo.shippingAddress?.name}
                  </p>
                  <p className="text-emerald-600 mt-0.5">
                    {orderInfo.items?.length ?? 0} item(s) · ৳{orderInfo.total}
                    {orderInfo.shippingAddress?.district &&
                      ` · ${orderInfo.shippingAddress.district}`}
                  </p>
                </div>
              </div>
            )}

            {pickBlocked && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">
                    {pickGate!.pickedCount}/{pickGate!.requiredCount} piece(s)
                    picked.
                  </span>{" "}
                  Finish scanning all barcodes in Order Fulfillment before
                  booking a shipment.
                </p>
              </div>
            )}

            {bookError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700">{bookError}</p>
              </div>
            )}
          </div>

          {/* Provider selection */}
          <Field label="Courier Provider">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeProviders.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProviderId(p.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                    providerId === p.id
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {p.logo ? (
                    <img
                      src={p.logo}
                      alt={p.displayName}
                      className="w-7 h-7 object-contain rounded"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center">
                      <Truck className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-800 leading-tight">
                    {p.displayName}
                  </span>
                </button>
              ))}
            </div>
          </Field>

          {/* Recipient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Recipient Name">
              <input
                value={form.recipientName}
                onChange={(e) => set("recipientName", e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </Field>
            <Field label="Recipient Phone">
              <input
                value={form.recipientPhone}
                onChange={(e) => set("recipientPhone", e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </Field>
          </div>

          <Field label="Delivery Address">
            <textarea
              rows={2}
              value={form.recipientAddress}
              onChange={(e) => set("recipientAddress", e.target.value)}
              placeholder="Full address with district"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none"
            />
          </Field>

          {/* Item details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Weight (kg)">
              <input
                type="number"
                value={form.weight}
                min={0.1}
                step={0.1}
                onChange={(e) => set("weight", Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </Field>
            <Field label="COD Amount (৳)">
              <input
                type="number"
                value={form.codAmount}
                min={0}
                onChange={(e) => set("codAmount", Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </Field>
            <Field label="Delivery Type">
              <select
                value={form.deliveryType}
                onChange={(e) => set("deliveryType", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              >
                <option value="48">Normal (48h)</option>
                <option value="12">On Demand</option>
              </select>
            </Field>
            <Field label="Item Type">
              <select
                value={form.itemType}
                onChange={(e) => set("itemType", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              >
                <option value="2">Parcel</option>
                <option value="1">Document</option>
              </select>
            </Field>
          </div>

          <Field label="Item Description">
            <input
              value={form.itemDescription}
              onChange={(e) => set("itemDescription", e.target.value)}
              placeholder="e.g. T-Shirt (M) x2, Hoodie x1"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
          </Field>

          <Field label="Special Instructions (optional)">
            <input
              value={form.special_instruction}
              onChange={(e) => set("special_instruction", e.target.value)}
              placeholder="Fragile, call before delivery, etc."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setBookError(null);
              if (!orderNumber || !providerId) {
                setBookError("Order ID and provider are required");
                return;
              }
              if (pickBlocked) {
                setBookError(
                  `${pickGate!.pickedCount}/${pickGate!.requiredCount} piece(s) picked — finish scanning all barcodes in Order Fulfillment before booking.`,
                );
                return;
              }
              setLoading(true);
              try {
                await onBook({
                  orderId,
                  orderNumber,
                  providerId: Number(providerId),
                  ...form,
                  deliveryType: Number(form.deliveryType),
                  itemType: Number(form.itemType),
                });
              } catch (e: any) {
                setBookError(
                  e?.response?.data?.message ?? "Failed to book shipment",
                );
              } finally {
                setLoading(false);
              }
            }}
            disabled={
              loading ||
              !orderNumber ||
              !providerId ||
              pickGateLoading ||
              pickBlocked
            }
            title={
              pickBlocked
                ? `${pickGate!.pickedCount}/${pickGate!.requiredCount} piece(s) picked — scan all barcodes before booking`
                : pickGateLoading
                  ? "Checking pick status…"
                  : undefined
            }
            className="flex-1 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {(loading || pickGateLoading) && (
              <RefreshCw className="w-4 h-4 animate-spin" />
            )}
            {loading ? "Booking..." : "Book Shipment"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Provider Form Modal ───────────────────────────────────────────────────────
const ProviderModal: React.FC<{
  existing?: Provider | null;
  onClose: () => void;
  onSave: (data: Partial<Provider>) => Promise<void>;
}> = ({ existing, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    displayName: existing?.displayName ?? "",
    logo: existing?.logo ?? "",
    priority: existing?.priority ?? 0,
    isActive: existing?.isActive ?? true,
    config: existing?.config ? JSON.stringify(existing.config, null, 2) : "{}",
  });
  const [saving, setSaving] = useState(false);
  const [configError, setConfigError] = useState(false);

  const handleSave = async () => {
    let config;

    try {
      config = JSON.parse(form.config);
      setConfigError(false);
    } catch {
      setConfigError(true);
      toast.error("Config must be valid JSON");
      return;
    }
    setSaving(true);
    await onSave({ ...form, config });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {existing ? "Edit Provider" : "New Provider"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Provider Key (PATHAO / STEADFAST / REDX)">
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    name: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="PATHAO"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-400"
                disabled={!!existing}
              />
            </Field>
            <Field label="Display Name">
              <input
                value={form.displayName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, displayName: e.target.value }))
                }
                placeholder="Pathao Courier"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Logo URL">
              <input
                value={form.logo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, logo: e.target.value }))
                }
                placeholder="https://..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </Field>
            <Field label="Priority (higher = preferred)">
              <input
                type="number"
                value={form.priority}
                onChange={(e) =>
                  setForm((p) => ({ ...p, priority: Number(e.target.value) }))
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </Field>
          </div>

          <Field label="Status">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                form.isActive
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-gray-50 text-gray-500"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${form.isActive ? "bg-emerald-500" : "bg-gray-300"}`}
              />
              {form.isActive ? "Active" : "Inactive"}
            </button>
          </Field>

          <Field label="Config (JSON)" hint="API keys, store IDs, sandbox flag">
            <textarea
              rows={8}
              value={form.config}
              onChange={(e) =>
                setForm((p) => ({ ...p, config: e.target.value }))
              }
              className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none resize-none ${
                configError
                  ? "border-red-300 focus:border-red-400"
                  : "border-gray-200 focus:border-indigo-400"
              }`}
              spellCheck={false}
            />
            {configError && (
              <p className="text-xs text-red-500 mt-1">Invalid JSON</p>
            )}
          </Field>
        </div>

        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.displayName}
            className="flex-1 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {saving ? "Saving..." : existing ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Shipment Detail Drawer ────────────────────────────────────────────────────
const ShipmentDrawer: React.FC<{
  id: number;
  onClose: () => void;
  onSync: (id: number) => Promise<void>;
  onCancel: (id: number) => Promise<void>;
}> = ({ id, onClose, onSync, onCancel }) => {
  const axiosSecure = useAxiosSecure();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axiosSecure.get(`/courier/shipments/${id}`);
      setShipment(r.data);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure, id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    await onSync(id);
    await load();
    setSyncing(false);
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this shipment?")) return;
    setCancelling(true);
    await onCancel(id);
    await load();
    setCancelling(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Shipment Details</p>
            <p className="text-base font-semibold text-gray-900 mt-0.5">
              #{id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : !shipment ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Not found
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Status */}
            <div className="flex items-center justify-between">
              <StatusBadge status={shipment.status} />
              {shipment.providerStatus && (
                <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                  {shipment.providerStatus}
                </span>
              )}
            </div>

            {/* Tracking */}
            {shipment.trackingNumber && (
              <InfoCard title="Tracking">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-gray-800 font-semibold">
                    {shipment.trackingNumber}
                  </span>
                  {shipment.trackingUrl && (
                    <a
                      href={shipment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Track
                    </a>
                  )}
                </div>
              </InfoCard>
            )}

            {/* Order */}
            <InfoCard title="Order">
              <div className="space-y-2">
                <Row label="Order ID" value={shipment.order?.orderId} mono />
                <Row label="Customer" value={shipment.order?.customerName} />
                <Row label="Phone" value={shipment.order?.customerPhone} mono />
                <Row label="Total" value={taka(shipment.order?.total ?? 0)} />
              </div>
            </InfoCard>

            {/* Financials */}
            <InfoCard title="Financials">
              <div className="space-y-2">
                <Row
                  label="COD Amount"
                  value={taka(shipment.codAmount ?? 0)}
                  highlight={!!shipment.codAmount}
                />
                <Row
                  label="Delivery Charge"
                  value={
                    shipment.deliveryCharge
                      ? taka(shipment.deliveryCharge)
                      : "—"
                  }
                />
              </div>
            </InfoCard>

            {/* Timestamps */}
            <InfoCard title="Timeline">
              <div className="space-y-2">
                <Row label="Booked" value={fmtDate(shipment.createdAt)} />
                {shipment.lastSyncAt && (
                  <Row label="Last Sync" value={fmtDate(shipment.lastSyncAt)} />
                )}
                {shipment.deliveredAt && (
                  <Row
                    label="Delivered"
                    value={fmtDate(shipment.deliveredAt)}
                    highlight
                  />
                )}
              </div>
            </InfoCard>

            {/* Error */}
            {shipment.errorMessage && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">
                    {shipment.errorMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Webhook logs */}
            {shipment.courierWebhookLogs?.length > 0 && (
              <InfoCard title="Recent Webhook Events">
                <div className="space-y-2">
                  {shipment.courierWebhookLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-xs font-mono text-gray-600">
                        {log.eventType}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${log.processed ? "bg-emerald-400" : "bg-amber-400"}`}
                        />
                        <span className="text-[10px] text-gray-400">
                          {fmtDate(log.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}
          </div>
        )}

        {/* Actions footer */}
        {shipment && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 bg-white text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              <RefreshCw
                className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : "Sync Status"}
            </button>
            {!["DELIVERED", "CANCELLED", "RETURNED"].includes(
              shipment.status,
            ) && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-red-50 text-red-700 border border-red-200 text-sm rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                {cancelling ? "Cancelling..." : "Cancel"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CourierManagement() {
  const axiosSecure = useAxiosSecure();
  const searchParams = useSearchParams();
  const { company } = useFetchCompany();
  const { printingSettings } = useFetchPrintingSettings();

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (orderId) setShowBookModal(true);
  }, [searchParams]);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tab, setTab] = useState<Tab>("shipments");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CourierStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  console.log(shipments, "shipments");

  // Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState<
    Provider | null | "new"
  >(null);
  const [drawerShipmentId, setDrawerShipmentId] = useState<number | null>(null);
  const [printingShipment, setPrintingShipment] = useState<Shipment | null>(
    null,
  );

  // ── Load ──
  const loadShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      });
      const r = await axiosSecure.get(`/courier/shipments?${params}`);
      setShipments(r.data.data);
      setTotalPages(r.data.meta.totalPages);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure, page, statusFilter, search]);

  const loadProviders = useCallback(async () => {
    const r = await axiosSecure.get("/courier/providers");
    // console.log(r.data, "provider-data");
    setProviders(r.data);
  }, [axiosSecure]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    if (tab === "shipments") loadShipments();
  }, [tab, loadShipments, page, statusFilter, search]);

  useEffect(() => {
    if (!printingShipment) return;
    const cleanup = () => setPrintingShipment(null);
    window.addEventListener("afterprint", cleanup, { once: true });
    printLabelSheet(
      printingSettings?.courierLabelWidthMm ?? 100,
      printingSettings?.courierLabelHeightMm ?? 150,
    );
    return () => window.removeEventListener("afterprint", cleanup);
  }, [
    printingShipment,
    printingSettings?.courierLabelWidthMm,
    printingSettings?.courierLabelHeightMm,
  ]);

  // ── Actions ──
  const handleBook = async (data: any) => {
    // Errors are intentionally left to propagate — BookModal shows them
    // inline instead of via a toast.
    await axiosSecure.post("/courier/shipments", data);
    toast.success("Shipment booked!");
    setShowBookModal(false);
    loadShipments();
  };

  const handleSync = async (id: number) => {
    try {
      await axiosSecure.post(`/courier/shipments/${id}/sync`);
      toast.success("Synced");
      loadShipments();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Sync failed");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await axiosSecure.post(`/courier/shipments/${id}/cancel`);
      toast.success("Shipment cancelled");
      loadShipments();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Cancel failed");
    }
  };

  const handleSaveProvider = async (data: any) => {
    try {
      if (typeof showProviderModal === "object" && showProviderModal?.id) {
        await axiosSecure.patch(
          `/courier/providers/${showProviderModal.id}`,
          data,
        );
        toast.success("Provider updated");
      } else {
        await axiosSecure.post("/courier/providers", data);
        toast.success("Provider created");
      }
      setShowProviderModal(null);
      loadProviders();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Save failed");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    setIsProcessing(true);

    try {
      await axiosSecure.delete(`/courier/providers/${deleteId}`);
      toast.success("Provider deleted");

      setDeleteId(null);
      loadProviders();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Delete failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Render ──
  const TABS: { id: Tab; label: string }[] = [
    { id: "shipments", label: "Shipments" },
    { id: "providers", label: "Providers" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Courier Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Book, track, and manage courier shipments and provider settings
          </p>
        </div>

        <button
          onClick={() => setShowBookModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Book Shipment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {/* ─── SHIPMENTS TAB ─── */}
        {tab === "shipments" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search order ID, customer, tracking…"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as CourierStatus | "");
                  setPage(1);
                }}
                className="py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 text-gray-700"
              >
                <option value="">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>

              <button
                onClick={loadShipments}
                className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "Shipment",
                      "Order",
                      "Customer",
                      "Provider",
                      "Status",
                      "COD",
                      "Date",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <RefreshCw className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
                      </td>
                    </tr>
                  ) : shipments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-16 text-center text-gray-400 text-sm"
                      >
                        No shipments found
                      </td>
                    </tr>
                  ) : (
                    shipments.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setDrawerShipmentId(s.id)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs font-medium text-gray-900">
                            #{s.id}
                          </p>
                          {s.trackingNumber && (
                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                              {s.trackingNumber}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-900 font-mono">
                            {s.order?.orderId}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-700 font-medium">
                            {s.order?.customerName}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {s.order?.customerPhone}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                            {s.provider?.displayName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono font-medium text-gray-700">
                            {s.codAmount ? taka(s.codAmount) : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {fmtDate(s.createdAt)}
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSync(s.id)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Sync"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                            {(s.trackingNumber || s.consignmentId) && (
                              <button
                                onClick={() => setPrintingShipment(s)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Print Label"
                              >
                                <Printer className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── PROVIDERS TAB ─── */}
        {tab === "providers" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 font-medium">
                {providers.length} provider{providers.length !== 1 ? "s" : ""}{" "}
                configured
              </p>
              <button
                onClick={() => setShowProviderModal("new")}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Provider
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {p.logo ? (
                        <img
                          src={p.logo}
                          alt={p.displayName}
                          className="w-10 h-10 object-contain rounded-lg border border-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Truck className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {p.displayName}
                        </p>
                        <p className="text-xs font-mono text-gray-400 uppercase">
                          {p.name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.isActive ? "Active" : "Off"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    <span>Priority: {p.priority}</span>
                    <span>ID: {p.id}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowProviderModal(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" /> Configure
                    </button>
                    <button
                      onClick={() => setDeleteId(p.id)}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 border border-red-100 rounded-lg transition-colors text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {providers.length === 0 && (
                <div className="col-span-3 py-16 text-center text-gray-400 text-sm">
                  No providers yet. Add your first courier partner.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {deleteId && (
        <DeleteConfirmationModal
          open={!!deleteId}
          isLoading={isProcessing}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {showBookModal && (
        <BookModal
          providers={providers}
          onClose={() => setShowBookModal(false)}
          onBook={handleBook}
          initialOrderId={searchParams.get("orderId") ?? ""} // ← add this
        />
      )}

      {showProviderModal && (
        <ProviderModal
          existing={showProviderModal === "new" ? null : showProviderModal}
          onClose={() => setShowProviderModal(null)}
          onSave={handleSaveProvider}
        />
      )}

      {drawerShipmentId && (
        <ShipmentDrawer
          id={drawerShipmentId}
          onClose={() => setDrawerShipmentId(null)}
          onSync={handleSync}
          onCancel={handleCancel}
        />
      )}

      {printingShipment && (
        <div className="print-label-sheet fixed -left-2500 -top-2500">
          <ShipmentLabel
            shipment={printingShipment}
            company={company}
            widthMm={printingSettings?.courierLabelWidthMm}
            heightMm={printingSettings?.courierLabelHeightMm}
          />
        </div>
      )}
    </div>
  );
}

// ── Tiny shared components ────────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value?: string | number;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span
        className={`text-xs font-medium ${mono ? "font-mono" : ""} ${highlight ? "text-emerald-700 font-semibold" : "text-gray-800"}`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}
