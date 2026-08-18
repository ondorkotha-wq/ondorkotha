"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentFailedComp() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId");
  const orderId = searchParams.get("orderId");
  return (
    <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
      <div className="bg-white border border-stone-200 max-w-md w-full px-10 py-12 text-center shadow-sm rounded-sm">
        <div className="w-11 h-11 rounded-full border border-red-700 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-4 h-4 text-red-700"
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

        <p className="text-[10px] tracking-[0.22em] uppercase text-red-700 mb-2">
          Transaction Failed
        </p>

        <h1 className="text-2xl font-light text-stone-800 tracking-wide mb-1">
          Payment Unsuccessful
        </h1>

        <div className="w-10 h-px bg-stone-200 mx-auto mb-6" />

        <p className="text-sm text-stone-500 leading-relaxed mb-4">
          Something went wrong during payment.
          <br />
          please try again.
        </p>

        {transactionId && (
          <p className="text-xs text-stone-400 italic mb-8">
            Reference · {transactionId}
          </p>
        )}

        {!transactionId && <div className="mb-8" />}

        <Link
          href={
            orderId
              ? `/order?orderId=${orderId}`
              : "/dashboard?activeItem=orders"
          }
          className="inline-block text-[11px] tracking-[0.18em] uppercase border border-stone-800 text-stone-800 px-8 py-3 hover:bg-stone-800 hover:text-white transition-colors duration-200"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}
