"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentCancelledComp() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId");
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
      <div className="bg-white border border-stone-200 max-w-md w-full px-10 py-12 text-center shadow-sm rounded-sm">
        <div className="w-11 h-11 rounded-full border border-amber-700 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-4 h-4 text-amber-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <p className="text-[10px] tracking-[0.22em] uppercase text-amber-700 mb-2">
          Payment Cancelled
        </p>

        <h1 className="text-2xl font-light text-stone-800 tracking-wide mb-1">
          Order Not Placed
        </h1>

        <div className="w-10 h-px bg-stone-200 mx-auto mb-6" />

        <p className="text-sm text-stone-500 leading-relaxed mb-8">
          You cancelled the payment.
          <br />
        </p>

        <Link
          href={orderId ? `/order/${orderId}` : "/dashboard?activeItem=orders"}
          className="inline-block text-[11px] tracking-[0.18em] uppercase border border-stone-800 text-stone-800 px-8 py-3 hover:bg-stone-800 hover:text-white transition-colors duration-200"
        >
          {orderId ? "Return to Order" : "Back to Orders"}
        </Link>
      </div>
    </div>
  );
}
