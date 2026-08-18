/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const Payment = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const axiosSecure = useAxiosSecure();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!orderId) {
      toast.error("Invalid order");
      router.replace("/cart");
      return;
    }

    const initPayment = async () => {
      try {
        setLoading(true);

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
      } catch (error: any) {
        console.error("Payment initialization error:", error);
        toast.error(
          error?.response?.data?.message ||
            "Something went wrong while initializing payment",
        );
      } finally {
        setLoading(false);
      }
    };

    if (!initialized) {
      initPayment();
    }
  }, [orderId, axiosSecure, router, initialized]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        {loading ? (
          <>
            <h2 className="text-xl font-semibold">
              Redirecting to SSLCommerz...
            </h2>
            <p className="text-sm text-gray-500">
              Please wait while we connect you to secure payment.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold">Preparing Payment...</h2>
            <p className="text-sm text-gray-500">Do not refresh this page.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Payment;
