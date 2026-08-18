"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PaymentSuccessComp() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId");
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown === 0) {
      router.push("/dashboard?activeItem=orders");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
      <div className="bg-white border border-stone-200 max-w-md w-full px-10 py-12 text-center shadow-sm rounded-sm">

        <div className="w-11 h-11 rounded-full border border-emerald-700 flex items-center justify-center mx-auto mb-6">
          <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <p className="text-[10px] tracking-[0.22em] uppercase text-emerald-700 mb-2">
          Order Confirmed
        </p>

        <h1 className="text-2xl font-light text-stone-800 tracking-wide mb-1">
          Payment Successful
        </h1>

        <div className="w-10 h-px bg-stone-200 mx-auto mb-6" />

        <p className="text-sm text-stone-500 leading-relaxed mb-4">
          Your order has been received.
          <br />
          We will take care of the rest.
        </p>

        {transactionId && (
          <p className="text-xs text-stone-400 italic mb-6">
            Transaction · {transactionId}
          </p>
        )}

        <p className="text-xs text-stone-400 mb-8">
          Redirecting to your orders in{" "}
          <span className="text-stone-600 tabular-nums">{countdown}s</span>
        </p>

        <Link
          href="/dashboard?activeItem=orders"
          className="inline-block text-[11px] tracking-[0.18em] uppercase border border-stone-800 text-stone-800 px-8 py-3 hover:bg-stone-800 hover:text-white transition-colors duration-200"
        >
          View Orders
        </Link>

      </div>
    </div>
  );
}