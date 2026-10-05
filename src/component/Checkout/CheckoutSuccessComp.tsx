"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const { token, loading: authLoading } = useAuth();
  const isSignedIn = !authLoading && !!token;
  const isGuest = !authLoading && !token;
  // Guest orders are listed per browser at /my-orders; the account
  // dashboard needs a login
  const ordersHref = isGuest ? "/my-orders" : "/dashboard?activeItem=orders";

  const [countdown, setCountdown] = useState(4);

  // Signed-in customers are taken to their orders automatically. Guests
  // aren't: they should note the order number and read that their history
  // lives on this browser only.
  useEffect(() => {
    if (!isSignedIn) return;
    if (countdown === 0) {
      router.push("/dashboard?activeItem=orders");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router, isSignedIn]);

  return (
    <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
      <div className="bg-white border border-stone-200 max-w-md w-full px-10 py-14 text-center shadow-sm rounded-sm">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full border border-stone-800 flex items-center justify-center mx-auto mb-6">
          <Check size={20} className="text-stone-800" />
        </div>

        {/* Small Label */}
        <p className="text-[10px] tracking-[0.22em] uppercase text-stone-500 mb-2">
          Order Confirmed
        </p>

        {/* Heading */}
        <h1 className="text-2xl font-light text-stone-900 tracking-wide mb-2">
          Thank You for Your Order
        </h1>

        <div className="w-10 h-px bg-stone-200 mx-auto mb-6" />

        {/* Description */}
        <p className="text-sm text-stone-500 leading-relaxed mb-6">
          Your order has been successfully placed.
          <br />
          Our team will review and confirm it shortly.
        </p>

        {/* Order ID */}
        {orderId && (
          <div className="mb-8">
            <p className="text-[10px] tracking-[0.18em] uppercase text-stone-400">
              Order Number
            </p>
            <p className="mt-1 text-sm font-medium text-stone-800 tabular-nums break-all">
              {orderId}
            </p>
          </div>
        )}

        {isGuest && (
          <p className="text-xs text-stone-500 leading-relaxed mb-8 border border-stone-200 bg-stone-50 px-4 py-3 text-left">
            Your guest orders are saved on this browser — find them any time
            under <span className="font-medium text-stone-700">My Orders</span>.
            Clearing your browser data or switching devices will hide them.{" "}
            <Link
              href="/login?redirect=/my-orders"
              className="underline text-stone-700 hover:text-stone-900"
            >
              Log in or create an account
            </Link>{" "}
            on this device to keep them in your account.
          </p>
        )}

        {/* Redirect */}
        {isSignedIn && (
          <p className="text-xs text-stone-400 mb-8">
            Redirecting to your orders in{" "}
            <span className="text-stone-700 tabular-nums">{countdown}s</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push(ordersHref)}
            disabled={authLoading}
            className="w-full text-[11px] tracking-[0.18em] uppercase border border-stone-800 text-stone-800 px-8 py-3 hover:bg-stone-800 hover:text-white transition-colors duration-200 disabled:opacity-50"
          >
            View My Orders
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full text-[11px] tracking-[0.18em] uppercase text-stone-500 hover:text-stone-800 transition-colors duration-200"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
