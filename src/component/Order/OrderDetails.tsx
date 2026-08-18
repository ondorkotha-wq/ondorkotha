/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useOrderTrackingSocket from "@/hooks/Order/useOrderTrackingSocket";
import LoadingDots from "@/component/Loading/LoadingDS";
import Link from "next/link";
import {
  FiStar,
  FiCheckCircle,
  FiTruck,
  FiCreditCard,
  FiAlertCircle,
  FiDownload,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { devLog } from "@/utils/devlog";
import { FullScreenCenter } from "../Screen/FullScreenCenter";

const OrderDetails = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const axiosSecure = useAxiosSecure();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States for Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await axiosSecure.get(
        `orders/track/${orderId}?details=true`,
      );

      devLog(res.data);

      setOrder(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [orderId, axiosSecure]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Refetch the order whenever the backend pushes a status change for it
  // (e.g. a courier webhook or admin update) — keeps this page live without
  // a manual refresh, while the REST call above stays the source of truth.
  useOrderTrackingSocket({ orderId, onStatusUpdated: fetchOrder });

  const handleOpenReview = (item: any) => {
    setSelectedItem(item);
    setIsReviewModalOpen(true);
  };

  const handleRetryPayment = async () => {
    console.log("here");
    try {
      setRetrying(true);

      const { data } = await axiosSecure.post(
        `/payments/sslcommerz/initiate/${orderId}`,
      );

      console.log("Payment initiation response:", data);

      if (!data?.data.redirectUrl) {
        toast.error("Payment initialization failed");
        return;
      }

      setInitialized(true);

      // Redirect to SSLCommerz gateway
      window.location.href = data.data.redirectUrl.gatewayPageUrl;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setRetrying(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order?.invoiceId) return;
    setDownloading(true);
    try {
      const res = await axiosSecure.get(`/invoices/${order.invoiceId}/pdf`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.invoiceId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download invoice");
    } finally {
      setDownloading(false);
    }
  };

  const submitReview = async () => {
    if (!comment.trim()) return toast.error("Please write a comment");
    setSubmittingReview(true);
    try {
      await axiosSecure.post(`/reviews/${selectedItem.id}`, {
        rating,
        comment,
      });
      toast.success("Review submitted successfully!");
      setIsReviewModalOpen(false);
      const res = await axiosSecure.get(`orders/track/${orderId}?details=true`);
      setOrder(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const orderProgressBar = () => {
    return (
      <section className="mb-16 bg-white border border-gray-100 p-6 md:p-12">
        {/* Container: Vertical on mobile (flex-col), Horizontal on desktop (md:flex-row) */}
        <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-0">
          {/* The Connecting Line - Desktop Only */}
          {/* We hide the absolute lines on mobile because we'll use border-left instead */}
          <div className="hidden md:block absolute top-5 left-0 w-full h-[1px] bg-gray-100 -z-0" />

          {order.trackingEvents.map((event: any, idx: number) => (
            <div
              key={idx}
              className="flex flex-row md:flex-col items-start md:items-center relative z-10 w-full group"
            >
              {/* Circle and Vertical Line (Mobile) */}
              <div className="flex flex-col items-center mr-4 md:mr-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shrink-0
            ${
              event.completed
                ? "bg-black text-white shadow-lg shadow-black/10"
                : "bg-gray-50 text-gray-300 border border-gray-100"
            }`}
                >
                  {event.completed ? (
                    <FiCheckCircle size={18} />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>

                {/* Vertical line for mobile - hidden on last item */}
                {idx !== order.trackingEvents.length - 1 && (
                  <div
                    className={`md:hidden w-[1px] h-12 my-1 ${event.completed ? "bg-black" : "bg-gray-100"}`}
                  />
                )}
              </div>

              {/* Text Content */}
              <div className="flex flex-col md:items-center md:mt-4">
                <p
                  className={`text-[10px] uppercase tracking-widest font-bold md:text-center mb-1 
            ${event.current ? "text-black" : "text-gray-400"}`}
                >
                  {event.status}
                </p>
                <p className="text-[9px] text-gray-400 tabular-nums md:text-center">
                  {event.date}
                </p>
              </div>

              {/* Horizontal Connecting Line (Desktop Only) */}
              {idx !== order.trackingEvents.length - 1 && (
                <div
                  className={`hidden md:block absolute top-5 left-[50%] w-full h-[1px] -z-10 
            ${event.completed ? "bg-black" : "bg-gray-100"}`}
                />
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  if (loading)
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  if (!order)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-serif italic text-gray-500">
        Order not found
      </div>
    );

  const latestPayment = order?.payments?.[0];
  const isPartiallyPaid = order.paymentStatus === "PARTIALLY_PAID";
  const isPaymentIncomplete =
    !!latestPayment && latestPayment.status !== "PAID";

  return (
    <div className="min-h-screen bg-[#fffdfa] text-[#262626] antialiased">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        {/* Header Area */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-gray-100 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-3">
                Order Tracking
              </p>
              <h1 className="text-4xl font-serif italic tracking-tight">
                {order.orderNumber}
              </h1>
              <div className="flex gap-4 mt-3 text-xs uppercase tracking-widest text-gray-500">
                <p>Placed: {order.orderDate}</p>
                {order.estimatedDelivery && (
                  <p className="text-black font-bold">
                    • Est. Delivery: {order.estimatedDelivery}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {order.invoiceId && (
                <button
                  onClick={handleDownloadInvoice}
                  disabled={downloading}
                  className="cursor-pointer flex items-center gap-2 text-[10px] uppercase tracking-widest px-5 py-2.5 border border-black font-bold hover:bg-black hover:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  <FiDownload className={downloading ? "animate-bounce" : ""} />
                  {downloading ? "Preparing..." : "Download Invoice"}
                </button>
              )}

              <span className="text-[10px] uppercase tracking-widest px-5 py-2.5 bg-black text-white font-bold">
                {order.status}
              </span>
              {latestPayment && (
                <span
                  className={`text-[10px] uppercase tracking-widest px-5 py-2.5 border font-bold
                ${latestPayment.status === "PAID" ? "border-green-600 text-green-600" : "border-orange-500 text-orange-500"}`}
                >
                  Payment:{" "}
                  {isPartiallyPaid ? "Partially Paid" : latestPayment.status}
                </span>
              )}
            </div>
          </div>

          {/* Independent Retry Payment Banner */}
          {isPaymentIncomplete && (
            <div className="mt-8 p-6 bg-white border border-red-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
              <div className="flex gap-4 items-center">
                <FiAlertCircle className="text-red-500 text-2xl shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700 uppercase tracking-tight">
                    Payment Incomplete
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Your items are reserved, but we need payment to process the
                    shipment.
                  </p>
                </div>
              </div>
              <button
                disabled={retrying}
                onClick={handleRetryPayment}
                className="w-full md:w-auto px-8 py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-gray-800 transition-all active:scale-95 disabled:bg-gray-400"
              >
                {retrying ? "Processing..." : "Retry Payment Now"}
              </button>
            </div>
          )}

          {/* Deposit Paid — Balance Due Banner */}
          {!isPaymentIncomplete &&
            isPartiallyPaid &&
            order.remainingAmount! > 0 && (
              <div className="mt-8 p-6 bg-white border border-amber-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                <div className="flex gap-4 items-center">
                  <FiCreditCard className="text-amber-500 text-2xl shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-700 uppercase tracking-tight">
                      Deposit Paid — Balance Due on Delivery
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      You&apos;ve paid a {order.advancePercentage}% deposit. The
                      remaining ৳{order.remainingAmount} is due when your order
                      is delivered.
                    </p>
                  </div>
                </div>
              </div>
            )}
        </header>

        {/* Order Progress Stepper */}
        <div className="hidden md:block">{orderProgressBar()}</div>

        <div className="grid lg:grid-cols-3 gap-16">
          {/* Main Content - Items */}
          <div className="lg:col-span-2">
            <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold mb-8 text-gray-400 border-b border-gray-50 pb-4">
              Your Selection ({order.items.length})
            </h2>
            <div className="space-y-10">
              {order.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-8 pb-10 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div className="w-full sm:w-32 aspect-[3/4] overflow-hidden bg-gray-50">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-serif text-xl hover:text-gray-600 transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="font-medium text-lg text-black">
                          ৳{item.subtotal}
                        </p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest flex gap-3">
                          <span>
                            Color:{" "}
                            <span className="text-black font-semibold">
                              {item.color}
                            </span>
                          </span>
                          <span className="text-gray-200">|</span>
                          <span>
                            Size:{" "}
                            <span className="text-black font-semibold">
                              {item.size}
                            </span>
                          </span>
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                          SKU: {item.sku}
                        </p>
                        <p className="text-xs text-gray-500 pt-2 italic">
                          Qty: {item.quantity} × ৳{item.price}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8">
                      {order.status === "DELIVERED" || item.isReviewed ? (
                        item.isReviewed ? (
                          <span className="inline-flex items-center gap-2 text-green-600 text-[10px] uppercase tracking-widest font-bold bg-green-50 px-3 py-1.5">
                            <FiCheckCircle /> Verified Review
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenReview(item)}
                            className="text-[10px] uppercase tracking-[0.2em] font-bold border border-black px-6 py-3 hover:bg-black hover:text-white transition-all active:scale-95"
                          >
                            Write a Review
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Payment Info */}
            {order.payments && order.payments.length > 0 && (
              <div className="bg-white p-8 border border-gray-100 shadow-sm">
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-3 text-gray-400">
                  <FiCreditCard className="text-black" /> Payment Information
                </h3>
                <div className="text-xs space-y-4">
                  {order.payments.map((p: any, idx: number) => (
                    <div
                      key={p.id ?? idx}
                      className={idx > 0 ? "pt-4 border-t border-gray-100" : ""}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 uppercase tracking-wider">
                          {p.phase && p.phase !== "FULL"
                            ? `${p.phase === "ADVANCE" ? "Deposit" : "Remainder"} · ${p.method}`
                            : p.method}
                        </span>
                        <span
                          className={`font-bold ${p.status === "PAID" ? "text-green-600" : "text-orange-500"}`}
                        >
                          {p.status}
                        </span>
                      </div>
                      {p.amount != null && (
                        <div className="flex justify-between items-center mt-1 text-gray-400">
                          <span>Amount</span>
                          <span className="font-mono">৳{p.amount}</span>
                        </div>
                      )}
                      {p.transactionId && (
                        <p className="break-all font-mono text-[10px] bg-gray-50 p-2 mt-2 text-gray-600 uppercase leading-relaxed">
                          {p.transactionId}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Info */}
            <div className="bg-white p-8 border border-gray-100 shadow-sm">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-3 text-gray-400">
                <FiTruck className="text-black" /> Shipping Address
              </h3>
              <div className="text-xs space-y-2 leading-relaxed">
                <p className="font-bold text-black uppercase tracking-widest text-sm mb-3">
                  {order.shippingAddress.name}
                </p>
                <div className="space-y-1 text-gray-600">
                  <p className="flex justify-between">
                    <span>Phone</span>{" "}
                    <span className="text-black">
                      {order.shippingAddress.phone}
                    </span>
                  </p>
                  <p className="pt-2 italic">{order.shippingAddress.address}</p>
                  <p className="uppercase tracking-tighter font-bold text-black">
                    {order.shippingAddress.district}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-8 bg-[#262626] text-white shadow-xl shadow-black/10">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-8 opacity-40">
                Order Summary
              </h3>
              <div className="space-y-5 text-xs">
                <div className="flex justify-between opacity-70">
                  <span>Subtotal</span>
                  <span>৳{order.subtotal}</span>
                </div>
                <div className="flex justify-between opacity-70">
                  <span>Delivery</span>
                  <span>৳{order.deliveryCharge}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Discount</span>
                    <span>-৳{order.discount}</span>
                  </div>
                )}
                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">
                    Total
                  </span>
                  <span className="text-2xl font-serif italic">
                    ৳{order.total}
                  </span>
                </div>
                {isPartiallyPaid && (order.remainingAmount ?? 0) > 0 && (
                  <>
                    <div className="flex justify-between opacity-70">
                      <span>Deposit Paid</span>
                      <span>৳{order.advanceAmount}</span>
                    </div>
                    <div className="flex justify-between items-end text-amber-400">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
                        Balance Due
                      </span>
                      <span className="text-lg font-serif italic">
                        ৳{order.remainingAmount}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Progress Stepper */}
        <div className="md:hidden">{orderProgressBar()}</div>
      </div>

      {/* Review Modal - remains largely same but with refined paddings */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm transition-all">
          <div className="bg-white w-full max-w-lg p-10 shadow-2xl animate-in fade-in zoom-in duration-300 relative">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
            >
              ✕
            </button>
            <h2 className="text-2xl font-serif italic mb-8">Post a Review</h2>

            <div className="flex gap-6 mb-10 bg-[#fffdfa] border border-gray-100 p-4">
              <img
                src={selectedItem?.image}
                className="w-16 h-20 object-cover"
                alt=""
              />
              <div className="flex flex-col justify-center">
                <p className="text-sm font-bold uppercase tracking-tight">
                  {selectedItem?.name}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                  Order #{order.orderNumber}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-4 text-gray-400">
                Your Rating
              </label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transform transition hover:scale-110"
                  >
                    <FiStar
                      size={28}
                      className={
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-200"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-10">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-4 text-gray-400">
                Your Experience
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the quality, fit, and design?"
                className="w-full border-b border-gray-100 focus:border-black outline-none py-3 text-sm resize-none transition-all bg-transparent"
              />
            </div>

            <button
              disabled={submittingReview}
              onClick={submitReview}
              className="w-full bg-black text-white py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-gray-800 transition-all active:scale-[0.98] disabled:bg-gray-400"
            >
              {submittingReview ? "Uploading..." : "Publish Review"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
