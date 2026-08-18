"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  X,
  Printer,
  PackageCheck,
  AlertTriangle,
  Mail,
  MessageCircle,
} from "lucide-react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { useBarcodeScanInput } from "@/hooks/Barcode/useBarcodeScanInput";
import { printLabelSheet } from "@/component/admin/PrintLabels/printLabels";
import { TrackedItem } from "@/hooks/Track/useTrack";
import {
  AvailablePiece,
  PickSlip,
  ShipmentGroupStatus,
} from "@/types/reservation.types";

interface Props {
  orderId: string;
  items: TrackedItem[];
  onClose: () => void;
}

export default function OrderFulfillmentModal({
  orderId,
  items,
  onClose,
}: Props) {
  const axiosSecure = useAxiosSecure();
  const [pickSlip, setPickSlip] = useState<PickSlip | null>(null);
  const [groupStatus, setGroupStatus] = useState<ShipmentGroupStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const [openReserveFor, setOpenReserveFor] = useState<number | null>(null);
  const [availablePieces, setAvailablePieces] = useState<AvailablePiece[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  const [pickInput, setPickInput] = useState("");
  const [pickBusy, setPickBusy] = useState(false);

  const [stockByProductSizeId, setStockByProductSizeId] = useState<
    Record<number, number>
  >({});
  const [checkingStock, setCheckingStock] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [slipRes, statusRes] = await Promise.all([
        axiosSecure.get<PickSlip>(`/reservations/orders/${orderId}/pick-slip`),
        axiosSecure.get<ShipmentGroupStatus>(
          `/reservations/orders/${orderId}/shipment-group`,
        ),
      ]);
      setPickSlip(slipRes.data);
      setGroupStatus(statusRes.data);
    } catch {
      toast.error("Failed to load fulfillment data");
    } finally {
      setLoading(false);
    }
  }, [axiosSecure, orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const piecesTrackedItems = items.filter(
    (i) => i.productSizeId !== undefined && i.productSizeId !== null,
  );

  useEffect(() => {
    const sizeIds = Array.from(
      new Set(piecesTrackedItems.map((i) => i.productSizeId as number)),
    );
    if (sizeIds.length === 0) {
      setCheckingStock(false);
      return;
    }
    let cancelled = false;
    setCheckingStock(true);
    Promise.all(
      sizeIds.map((id) =>
        axiosSecure
          .get<AvailablePiece[]>("/reservations/available-pieces", {
            params: { productSizeId: id },
          })
          .then((res) => [id, res.data.length] as const)
          .catch(() => [id, -1] as const),
      ),
    ).then((results) => {
      if (cancelled) return;
      setStockByProductSizeId(Object.fromEntries(results));
      setCheckingStock(false);
    });
    return () => {
      cancelled = true;
    };
  }, [items, axiosSecure]);

  const reservedCountFor = (orderItemId: number) =>
    pickSlip?.lines.filter((l) => l.orderItemId === orderItemId).length ?? 0;

  const zeroStockItems = piecesTrackedItems.filter((item) => {
    const reserved = reservedCountFor(item.id);
    const stock = stockByProductSizeId[item.productSizeId as number];
    return reserved < item.quantity && stock === 0;
  });

  const openReserve = async (item: TrackedItem) => {
    if (!item.productSizeId) return;
    setOpenReserveFor(item.id);
    setLoadingAvailable(true);
    try {
      const { data } = await axiosSecure.get<AvailablePiece[]>(
        "/reservations/available-pieces",
        { params: { productSizeId: item.productSizeId } },
      );
      setAvailablePieces(data);
    } catch {
      toast.error("Failed to load available pieces");
    } finally {
      setLoadingAvailable(false);
    }
  };

  const reservePiece = async (item: TrackedItem, pieceId: number) => {
    try {
      await axiosSecure.post(`/reservations/orders/${orderId}/reserve`, {
        orderItemId: item.id,
        pieceId,
      });
      toast.success("Piece reserved");
      setOpenReserveFor(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to reserve piece");
    }
  };

  const releaseReservation = async (reservationId: number) => {
    try {
      await axiosSecure.delete(`/reservations/${reservationId}`);
      toast.success("Reservation released");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to release");
    }
  };

  const confirmPick = useCallback(
    async (barcodeValue: string) => {
      if (!pickSlip?.shipmentGroupId) {
        toast.error("No shipment group yet — reserve at least one piece first");
        return;
      }
      setPickBusy(true);
      try {
        await axiosSecure.post("/reservations/pick-confirm", {
          barcodeValue,
          shipmentGroupId: pickSlip.shipmentGroupId,
        });
        toast.success(`${barcodeValue} picked`);
        setPickInput("");
        load();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Failed to confirm pick");
      } finally {
        setPickBusy(false);
      }
    },
    [axiosSecure, pickSlip, load],
  );

  const { simulateManualEntry } = useBarcodeScanInput({
    enabled: true,
    onScan: (value) => confirmPick(value),
  });

  const printBlocked =
    !!groupStatus && groupStatus.requiredCount > 0 && !groupStatus.isFullyPicked;

  const printPickSlip = () => {
    if (printBlocked) return;
    setTimeout(() => printLabelSheet(80, 120, 0), 100);
  };

  const [sendMode, setSendMode] = useState<"email" | "whatsapp" | null>(null);
  const [recipientInput, setRecipientInput] = useState("");
  const [sending, setSending] = useState(false);

  const openSendPrompt = (mode: "email" | "whatsapp") => {
    setSendMode(mode);
    setRecipientInput(
      localStorage.getItem(mode === "email" ? "pickSlipEmail" : "pickSlipPhone") ?? "",
    );
  };

  const sendEmailPickSlip = async () => {
    if (!recipientInput || !pickSlip) return;
    setSending(true);
    try {
      await axiosSecure.post(`/reservations/orders/${orderId}/pick-slip/email`, {
        email: recipientInput,
      });
      localStorage.setItem("pickSlipEmail", recipientInput);
      toast.success("Pick slip emailed");
      setSendMode(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to email pick slip");
    } finally {
      setSending(false);
    }
  };

  const sendWhatsAppPickSlip = () => {
    if (!recipientInput || !pickSlip) return;
    const text = [
      `Pick Slip — ${orderId}`,
      ...pickSlip.lines.map(
        (l) =>
          `${l.barcodeValue} — ${l.productTitle} (${l.color}/${l.size}) — ${l.locationCode ?? "no shelf"}`,
      ),
    ].join("\n");
    const phone = recipientInput.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    localStorage.setItem("pickSlipPhone", recipientInput);
    setSendMode(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Order Fulfillment — {orderId}
            </h2>
            {groupStatus && groupStatus.requiredCount > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {groupStatus.pickedCount}/{groupStatus.requiredCount} piece(s)
                picked
                {groupStatus.isFullyPicked && (
                  <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <PackageCheck className="w-3.5 h-3.5" /> Ready to ship
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {!loading && !checkingStock && zeroStockItems.length > 0 && (
          <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 w-5 h-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                Out of stock — {zeroStockItems.length} item
                {zeroStockItems.length > 1 ? "s" : ""} can&apos;t be reserved
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-red-600">
                {zeroStockItems.map((item) => (
                  <li key={item.id}>
                    {item.name}
                    {[item.color, item.size].filter(Boolean).length > 0 &&
                      ` (${[item.color, item.size].filter(Boolean).join(" / ")})`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            Loading…
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {/* ── Reserve per order line ── */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">
                Reserve pieces
              </p>
              {piecesTrackedItems.length === 0 ? (
                <p className="text-xs text-gray-400">
                  This order has no piece-tracked line items.
                </p>
              ) : (
                <div className="space-y-2">
                  {piecesTrackedItems.map((item) => {
                    const reserved = reservedCountFor(item.id);
                    const full = reserved >= item.quantity;
                    return (
                      <div
                        key={item.id}
                        className="border border-gray-100 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {[item.color, item.size].filter(Boolean).join(" / ")}
                              {" — "}
                              {reserved}/{item.quantity} reserved
                            </p>
                          </div>
                          {!full && (
                            <button
                              onClick={() => openReserve(item)}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                              Reserve
                            </button>
                          )}
                        </div>

                        {openReserveFor === item.id && (
                          <div className="mt-2 border-t border-gray-50 pt-2 space-y-1 max-h-40 overflow-y-auto">
                            {loadingAvailable ? (
                              <p className="text-xs text-gray-400">Loading…</p>
                            ) : availablePieces.length === 0 ? (
                              <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                No in-stock pieces available for this variant.
                              </p>
                            ) : (
                              availablePieces.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => reservePiece(item, p.id)}
                                  className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-gray-50 text-left"
                                >
                                  <span className="font-mono">
                                    {p.barcodeValue}
                                  </span>
                                  <span className="text-gray-400">
                                    {p.location?.code ?? "no shelf yet"}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}

                        {pickSlip?.lines
                          .filter((l) => l.orderItemId === item.id)
                          .map((l) => (
                            <div
                              key={l.reservationId}
                              className="flex items-center justify-between text-xs mt-1.5 px-2 py-1 bg-gray-50 rounded"
                            >
                              <span className="font-mono">{l.barcodeValue}</span>
                              <span
                                className={
                                  l.pickedAt
                                    ? "text-emerald-600 font-medium"
                                    : "text-amber-600"
                                }
                              >
                                {l.pickedAt ? "Picked" : "Reserved"}
                              </span>
                              {!l.pickedAt && (
                                <button
                                  onClick={() =>
                                    releaseReservation(l.reservationId)
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  Release
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Pick slip + print ── */}
            {pickSlip && pickSlip.lines.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-800">
                    Pick Slip
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={printPickSlip}
                      disabled={printBlocked}
                      title={
                        printBlocked
                          ? `${groupStatus!.pickedCount}/${groupStatus!.requiredCount} piece(s) picked — scan all barcodes before printing the label`
                          : undefined
                      }
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <button
                      onClick={() => openSendPrompt("email")}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-gray-700 border border-gray-200 hover:bg-gray-50"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                    <button
                      onClick={() => openSendPrompt("whatsapp")}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-gray-700 border border-gray-200 hover:bg-gray-50"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                  </div>
                </div>

                {printBlocked && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2.5">
                    <AlertTriangle className="mt-0.5 w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <p className="text-xs text-amber-800">
                      <span className="font-semibold">
                        {groupStatus!.pickedCount}/{groupStatus!.requiredCount} piece(s)
                        picked.
                      </span>{" "}
                      Scan all barcodes in this shipment group before printing the label.
                    </p>
                  </div>
                )}

                {sendMode && (
                  <div className="flex items-center gap-2 mb-3 bg-gray-50 border border-gray-100 rounded-lg p-2">
                    <input
                      autoFocus
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendMode === "email"
                            ? sendEmailPickSlip()
                            : sendWhatsAppPickSlip();
                        }
                      }}
                      placeholder={
                        sendMode === "email"
                          ? "staff@example.com"
                          : "01XXXXXXXXX"
                      }
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      disabled={sending || !recipientInput}
                      onClick={
                        sendMode === "email"
                          ? sendEmailPickSlip
                          : sendWhatsAppPickSlip
                      }
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {sendMode === "email" ? "Send" : "Open WhatsApp"}
                    </button>
                    <button
                      onClick={() => setSendMode(null)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                      <th className="py-1.5">Barcode</th>
                      <th className="py-1.5">Product</th>
                      <th className="py-1.5">Shelf</th>
                      <th className="py-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickSlip.lines.map((l) => (
                      <tr key={l.reservationId} className="border-b border-gray-50">
                        <td className="py-1.5 font-mono">{l.barcodeValue}</td>
                        <td className="py-1.5">
                          {l.productTitle} ({l.color}/{l.size})
                        </td>
                        <td className="py-1.5">{l.locationCode ?? "—"}</td>
                        <td className="py-1.5">
                          {l.pickedAt ? "Picked" : "Reserved"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Pick confirm ── */}
            {pickSlip && pickSlip.shipmentGroupId && (
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Scan to confirm pick
                </p>
                <div className="flex gap-2">
                  <input
                    value={pickInput}
                    onChange={(e) => setPickInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") simulateManualEntry(pickInput);
                    }}
                    placeholder="PC-00000001"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => simulateManualEntry(pickInput)}
                    disabled={pickBusy}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Hidden print sheet ── */}
        <div className="print-label-sheet fixed -left-2500 -top-2500">
          <div className="label bg-white text-black p-4" style={{ width: "80mm" }}>
            <h3 className="font-bold text-sm mb-2">Pick Slip — {orderId}</h3>
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  <th className="text-left">Barcode</th>
                  <th className="text-left">Product</th>
                  <th className="text-left">Shelf</th>
                </tr>
              </thead>
              <tbody>
                {pickSlip?.lines.map((l) => (
                  <tr key={l.reservationId}>
                    <td>{l.barcodeValue}</td>
                    <td>
                      {l.productTitle} ({l.color}/{l.size})
                    </td>
                    <td>{l.locationCode ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
