/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { devLog } from "@/utils/devlog";
import { Product } from "@/types/product.types";

// ============================================================================
// Types
// ============================================================================

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED"
  | "RETURNED"
  | "ON_HOLD"
  | "PARTIALLY_DELIVERED"
  | "RETURN_REQUESTED";

export type FraudStatus = "SAFE" | "SUSPICIOUS" | "DOUBTFUL" | "BLOCKED";

export interface OrderUser {
  id: number;
  name?: string;
  fraudStatus: FraudStatus;
}

export interface OrderItem {
  id: number;
  productId: number;
  sku?: string;
  productTitle: string;
  quantity: number;
  priceAtPurchase: number;
  totalPriceAtPurchase: number;
  productSizeId?: number | null;
  product?: Product;
  order?: FullOrder;
}

export interface ThumbOrder {
  id: number;
  orderId: number;
  createdAt: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
}

export interface FullOrder {
  id: number;
  orderId: string;
  trackingToken: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddress: string;
  districtId?: number | null;
  districtName?: string | null;
  deliveryMethod?: string | null;
  deliveryCharge?: number | null;
  couponCode?: string | null;
  discount?: number | null;
  total: number;
  invoice?: { id: string } | null;
  itemCount?: number;
  status: OrderStatus;
  awbNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: OrderUser | null;
  hasOutOfStockItem?: boolean;
  items: OrderItem[];
  payments: any[];
  paymentStatus: PaymentStatus;
  advanceRequired?: boolean;
  advancePercentage?: number;
  advanceAmount?: number;
  remainingAmount?: number;
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PAID = "PAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  ON_HOLD = "ON_HOLD",
}

export interface PaginatedOrdersResponse<T = ThumbOrder | FullOrder> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  statusCounts: {
    PENDING: number;
    CONFIRMED: number;
    PACKED: number;
    SHIPPED: number;
    DELIVERED: number;
    CANCELLED: number;
    RETURNED: number;
    PROCESSING: number;
    RETURN_REQUESTED: number;
    FAILED: number;
    ON_HOLD: number;
    PARTIALLY_DELIVERED: number;
  };
}

export interface GetAllOrdersOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  sortBy?: "createdAt" | "total" | "status";
  order?: "asc" | "desc";
  thumb?: boolean;
  from?: string;
  to?: string;
}
// ===================
// Hook
// ===================

interface UseOrdersReturn {
  orders: PaginatedOrdersResponse<ThumbOrder | FullOrder> | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: AxiosError | null;
  refetch: () => void;
}

const useOrders = (options?: GetAllOrdersOptions): UseOrdersReturn => {
  // console.log(options,'options');
  const { loading: authLoading, token } = useAuth();
  const axiosSecure = useAxiosSecure();
  const [isTokenReady, setIsTokenReady] = useState(false);

  // Wait until token is ready
  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => setIsTokenReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, token]);

  const fetchOrders = async (): Promise<
    PaginatedOrdersResponse<ThumbOrder | FullOrder>
  > => {
    if (!token) throw new Error("Unauthorized");
    console.log(options, "options");

    const params: Record<string, any> = {};
    if (options?.page) params.page = options.page;
    if (options?.limit) params.limit = options.limit;
    if (options?.search) params.search = options.search;
    if (options?.status) params.status = options.status;
    if (options?.sortBy) params.sortBy = options.sortBy;
    if (options?.order) params.order = options.order;
    if (options?.thumb) params.thumb = options.thumb;
    if (options?.from) params.from = options.from;
    if (options?.to) params.to = options.to;

    try {
      const res = await axiosSecure.get<
        PaginatedOrdersResponse<ThumbOrder | FullOrder>
      >("/orders/all", { params });

      // console.log(res.data, "order dta");
      return res.data;
    } catch (error: any) {
      devLog("Failed to fetch orders", error);
      if (error.response?.status === 401)
        throw new Error("Unauthorized. Please login again.");
      throw error;
    }
  };

  const query = useQuery<PaginatedOrdersResponse, AxiosError>({
    queryKey: ["orders", options, token],
    queryFn: fetchOrders,
    enabled: !authLoading && isTokenReady,
    staleTime: 2 * 60 * 1000, // 2 min
    retry: (count, error) => {
      if (error.response?.status === 401) return false;
      if (
        error.response &&
        error.response.status >= 400 &&
        error.response.status < 500
      )
        return false;
      return count < 2;
    },
    refetchOnWindowFocus: false,
  });

  return {
    orders: query.data ?? null,
    isLoading: authLoading || query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export default useOrders;
