/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useTrackOrder from "@/hooks/Track/useTrack";
import {
  CheckCircle,
  Package,
  Truck,
  Clock,
  Home,
  Search,
  ArrowRight,
  AlertCircle,
  FileText,
  RotateCcw,
  XCircle,
  PauseCircle,
} from "lucide-react";

const statusIcons: Record<string, React.ReactNode> = {
  "Order Placed": <CheckCircle className="w-5 h-5" />,
  "Order Confirmed": <CheckCircle className="w-5 h-5" />,
  Processing: <Package className="w-5 h-5" />,
  Packed: <Package className="w-5 h-5" />,
  Shipped: <Truck className="w-5 h-5" />,
  "Out for Delivery": <Truck className="w-5 h-5" />,
  Delivered: <Home className="w-5 h-5" />,
  Cancelled: <XCircle className="w-5 h-5" />,
  Returned: <RotateCcw className="w-5 h-5" />,
  "Return Requested": <RotateCcw className="w-5 h-5" />,
  Failed: <XCircle className="w-5 h-5" />,
  "On Hold": <PauseCircle className="w-5 h-5" />,
  "Partially Delivered": <Truck className="w-5 h-5" />,
};

const taka = (n: number) =>
  `৳${Number(n).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;

const TrackOrderContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const axiosSecure = useAxiosSecure();

  const [orderIdInput, setOrderIdInput] = useState(
    searchParams.get("orderId") ?? "",
  );
  const [trackingId, setTrackingId] = useState(
    searchParams.get("orderId") ?? "",
  );
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const { order, isLoading, isError, error } = useTrackOrder({
    trackingId,
    details: true,
  });

  useEffect(() => {
    const fromQuery = searchParams.get("orderId");
    if (fromQuery && fromQuery !== trackingId) {
      setOrderIdInput(fromQuery);
      setTrackingId(fromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTrack = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!orderIdInput.trim()) {
      toast.error("Please enter your order number or tracking ID");
      return;
    }
    setTrackingId(orderIdInput.trim());
  };

  const handleDownloadInvoice = async () => {
    if (!order?.invoiceId) return;
    setDownloadingInvoice(true);
    try {
      const res = await axiosSecure.get(`/invoices/${order.invoiceId}/pdf`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const canReturn =
    order && ["DELIVERED", "PARTIALLY_DELIVERED"].includes(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Track Your Order
          </h1>
          <p className="text-gray-600 text-lg">
            Enter your order number to check the status of your purchase
          </p>
        </div>

        {/* Tracking Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl font-semibold text-gray-800">
              Find Your Order
            </h2>
          </div>

          <form onSubmit={handleTrack} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Number or Tracking ID *
              </label>
              <input
                type="text"
                placeholder="e.g. ORD-20260101-1234-000001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
              />
              <p className="mt-2 text-sm text-gray-500">
                Find your order number in your confirmation email or order
                history
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto px-8 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Tracking Order...
                </>
              ) : (
                <>
                  Track Order
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error state */}
        {trackingId && isError && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium">
              {(error as any)?.response?.status === 404
                ? "Order not found. Please check your order number."
                : "Couldn't load this order. Please try again."}
            </p>
          </div>
        )}

        {/* Order Result */}
        {order && !isError && (
          <div className="space-y-8 animate-fade-in">
            {/* Status Banner */}
            <div className="bg-linear-to-r from-gray-900 to-black text-white rounded-2xl p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Package className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold">Order Status</h2>
                  </div>
                  <p className="text-gray-300 text-lg">
                    Current Status:{" "}
                    <span className="font-semibold">
                      {order.trackingEvents.find((s) => s.current)?.status ??
                        order.status}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-300">Order ID</p>
                  <p className="text-2xl font-mono font-bold">
                    {order.orderNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Delivery Progress
              </h3>
              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200">
                  <div
                    className="absolute top-0 left-0 w-full bg-black transition-all duration-500"
                    style={{
                      height: `${
                        (order.trackingEvents.filter((s) => s.completed)
                          .length /
                          Math.max(order.trackingEvents.length - 1, 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <div className="relative space-y-8">
                  {order.trackingEvents.map((step, index) => (
                    <div key={index} className="flex gap-6">
                      <div
                        className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${
                          step.completed
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle className="w-7 h-7" />
                        ) : (
                          statusIcons[step.status] || (
                            <Clock className="w-7 h-7" />
                          )
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <h4
                            className={`text-lg font-medium ${
                              step.completed ? "text-gray-900" : "text-gray-600"
                            }`}
                          >
                            {step.status}
                          </h4>
                          {step.date && (
                            <span
                              className={`text-sm px-3 py-1 rounded-full ${
                                step.completed
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {step.date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Details Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Order Summary */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">
                  Order Summary
                </h3>

                <div className="space-y-6">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300">
                            <Package className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-600">
                            Qty: {item.quantity}
                          </span>
                          <span className="font-semibold">
                            {taka(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4 space-y-1">
                    {typeof order.discount === "number" &&
                      order.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>− {taka(order.discount)}</span>
                        </div>
                      )}
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Delivery</span>
                      <span>
                        {order.deliveryCharge
                          ? taka(order.deliveryCharge)
                          : "Free"}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-2">
                      <span>Total</span>
                      <span>{taka(order.total)}</span>
                    </div>
                    {order.advanceRequired && (
                      <>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Deposit Paid ({order.advancePercentage}%)</span>
                          <span>{taka(order.advanceAmount ?? 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Balance Due</span>
                          <span>{taka(order.remainingAmount ?? 0)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">
                  Shipping Information
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Delivery Address
                    </h4>
                    <p className="text-gray-900">
                      {order.shippingAddress?.address}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      {order.shippingAddress?.district}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Payment Status
                      </h4>
                      <p className="text-gray-900 font-medium">
                        {order.paymentStatus}
                      </p>
                    </div>
                    {order.awbNumber && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">
                          AWB / Tracking
                        </h4>
                        <p className="font-mono text-gray-900">
                          {order.awbNumber}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {order.invoiceId && (
                      <button
                        onClick={handleDownloadInvoice}
                        disabled={downloadingInvoice}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        <FileText className="w-4 h-4" />
                        {downloadingInvoice ? "Downloading…" : "Download Invoice"}
                      </button>
                    )}
                    {canReturn && (
                      <button
                        onClick={() =>
                          router.push(`/refund?orderId=${order.orderNumber}`)
                        }
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Request Return
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Need help with your order?
                  </h4>
                  <p className="text-blue-700 mb-4">
                    If you have questions about your delivery or need to make
                    changes, our customer service team is here to help.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => router.push("/help/contact-us")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      Contact Support
                    </button>
                    <button
                      onClick={() => router.push("/customer/orders")}
                      className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Order History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TrackOrder = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }
  >
    <TrackOrderContent />
  </Suspense>
);

export default TrackOrder;
