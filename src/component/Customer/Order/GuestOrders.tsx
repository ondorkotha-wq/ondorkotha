/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronLeft, ChevronRight, Package, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGuestOrders } from "@/hooks/Order/useGuestOrders";
import { STATUS_CONFIG } from "./AllOrders";

const taka = (n: number) =>
  `৳${Number(n).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const LIMIT = 10;
const ACCOUNT_ORDERS = "/dashboard?activeItem=orders";

// Orders placed as a guest from this browser (tied to its visitorId)
const GuestOrders = () => {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [page, setPage] = useState(1);

  const { orders, isLoading, isFetching, isError, refetch } = useGuestOrders({
    page,
    limit: LIMIT,
  });

  // Signed-in customers have their orders (guest ones included, once merged)
  // in their account
  useEffect(() => {
    if (!authLoading && token) router.replace(ACCOUNT_ORDERS);
  }, [authLoading, token, router]);

  const list = orders?.data ?? [];
  const meta = orders?.meta;

  if (authLoading || token) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-medium mb-1.5 tracking-tight text-gray-900">
          My Orders
        </h1>
        <p className="text-sm text-gray-500">
          Orders you placed as a guest on this browser
        </p>
      </div>

      <div className="mb-8 border border-amber-200 bg-amber-50 rounded-lg px-4 py-3 text-sm text-amber-800 flex gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          Guest orders are saved on this browser only — clearing your browser
          data or switching devices will hide them.{" "}
          <Link
            href="/login?redirect=/my-orders"
            className="underline font-medium hover:text-amber-900"
          >
            Log in or create an account
          </Link>{" "}
          on this device to keep them in your account.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {isLoading ? (
          <div className="text-center py-16 border border-gray-200 rounded-lg bg-white">
            <p className="text-gray-500 text-sm">Loading your orders…</p>
          </div>
        ) : isError ? (
          <div className="text-center py-16 border border-red-100 rounded-lg bg-red-50">
            <p className="text-red-700 text-sm font-medium">
              Couldn&apos;t load your orders.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-4 py-1.5 text-xs border border-red-200 rounded-lg bg-white hover:bg-red-100 text-red-700"
            >
              Try again
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 border border-gray-200 rounded-lg bg-white">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-900 text-sm font-medium">
              No orders on this browser yet
            </p>
            <Link
              href="/"
              className="inline-block mt-4 px-4 py-2 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          list.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            const thumbs = order.items
              .map((i) => i.product?.images?.[0]?.image)
              .filter((src): src is string => !!src)
              .slice(0, 3);

            return (
              <div
                key={order.id}
                className={`border border-gray-200 rounded-lg bg-white p-5 md:p-6 hover:border-gray-300 transition-colors ${
                  isFetching ? "opacity-70" : ""
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      {cfg.icon}
                      <h3 className="font-medium text-base text-gray-900 break-all">
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
                        {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
                        {taka(order.total)} · Cash on Delivery
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {thumbs.length > 0 && (
                      <div className="flex -space-x-2">
                        {thumbs.map((src, idx) => (
                          <img
                            key={idx}
                            src={src}
                            alt=""
                            loading="lazy"
                            className="w-10 h-10 rounded-full border-2 border-white object-cover bg-gray-100"
                            onError={(e) =>
                              (e.currentTarget.src = "/images/placeholder.svg")
                            }
                          />
                        ))}
                      </div>
                    )}
                    <Link
                      href={`/my-orders/track?orderId=${encodeURIComponent(order.orderId)}`}
                      className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Track
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isFetching}
            className="px-3 py-1.5 border border-gray-200 rounded-lg flex items-center gap-1 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span>
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages || isFetching}
            className="px-3 py-1.5 border border-gray-200 rounded-lg flex items-center gap-1 disabled:opacity-40"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default GuestOrders;
