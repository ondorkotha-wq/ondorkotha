/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import useAxiosSecure from "../Axios/useAxiosSecure";
import useAxiosPublic from "../Axios/useAxiosPublic";
import { CartItem } from "@/types/product.types";
import { isAuthenticated } from "@/utils/auth";
import { getVisitorId } from "@/utils/visitor";
import { devLog } from "@/utils/devlog";
import { useEffect, useState } from "react";

// ============================================================================
// Types
// ============================================================================
interface CartCoupon {
  code: string;
}

interface CartResponse {
  id: number | null;
  subtotalAtAdd: number;
  baseSubtotalAtAdd: number;
  codAvailable?: boolean;
  codMessage?: string;
  couponId?: number;
  coupon?: CartCoupon;
  items: CartItem[];
  discountAmount?: number;
  freeDelivery?: boolean;
}

interface UseFetchCartsOptions {
  productSlug?: string;
  colorId?: number;
  sizeId?: number;
  isSummary?: boolean;
}

interface UseFetchCartsReturn {
  cart: CartResponse | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: AxiosError | null;
  refetch: () => void;
}

// ============================================================================
// Hook
// ============================================================================

const useFetchCarts = (options?: UseFetchCartsOptions): UseFetchCartsReturn => {
  const { loading: authLoading, token } = useAuth(); // Add token
  const axiosSecure = useAxiosSecure();
  const axiosPublic = useAxiosPublic();
  const [isTokenReady, setIsTokenReady] = useState(false); // Add this

  // Check if token is ready (non-null or authenticated)
  useEffect(() => {
    if (!authLoading) {
      // Give a small delay to ensure axios interceptor is set up
      const timer = setTimeout(() => {
        setIsTokenReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, token]);

  const fetchCarts = async (): Promise<CartResponse> => {
    const params: Record<string, string | number | boolean> = {};

    if (options?.productSlug) params.productSlug = options.productSlug;
    if (options?.colorId !== undefined) params.colorId = options.colorId;
    if (options?.sizeId !== undefined) params.sizeId = options.sizeId;
    if (options?.isSummary !== undefined) params.isSummary = options.isSummary;

    try {
      // Wait a bit if we're still loading auth
      if (authLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (isAuthenticated() && token) {
        // Check for token as well
        // devLog("Fetching user cart with token:", token);
        const res = await axiosSecure.get<CartResponse>("/cart/items", {
          params,
        });

        // console.log(res.data, "caritems");
        return res.data;
      }

      // If authenticated but no token, wait a bit more
      if (isAuthenticated() && !token) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (token) {
          const res = await axiosSecure.get<CartResponse>("/cart/items", {
            params,
          });
          return res.data;
        }
      }

      // Fall back to guest cart
      const visitorId = await getVisitorId();

      const res = await axiosPublic.get<CartResponse>(
        `/guest/cart/items/${visitorId}`,
        { params },
      );

      // console.log(res.data, "cart-full");

      return res.data;
    } catch (error: any) {
      devLog("Failed to fetch cart", error);

      // If 401 and authenticated, try guest cart
      if (error.response?.status === 401 && isAuthenticated()) {
        devLog("401 received, falling back to guest cart");
        const visitorId = await getVisitorId();
        const guestRes = await axiosPublic.get<CartResponse>(
          `/guest/cart/items/${visitorId}`,
          { params },
        );
        return guestRes.data;
      }

      throw error;
    }
  };

  const query = useQuery<CartResponse, AxiosError>({
    queryKey: ["cart", options, token], // Add token to queryKey
    queryFn: fetchCarts,
    enabled: !authLoading && isTokenReady, // Use isTokenReady
    // staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (count, error) => {
      // Don't retry on 401 - we handle it in fetchCarts
      if (error.response?.status === 401) {
        return false;
      }
      if (
        error.response &&
        error.response.status >= 400 &&
        error.response.status < 500
      ) {
        return false;
      }
      return count < 2;
    },
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  return {
    cart: query.data ?? null,
    isLoading: authLoading || query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export default useFetchCarts;
