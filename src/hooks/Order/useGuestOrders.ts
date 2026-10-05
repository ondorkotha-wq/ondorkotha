"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import useAxiosPublic from "../Axios/useAxiosPublic";
import { getVisitorId } from "@/utils/visitor";
import type { OrderStatus } from "./useOrders";
import type { TrackedOrder } from "../Track/useTrack";

// Shape of GET /guest/orders (backend OrderService.getGuestOrders)
export interface GuestOrderItem {
  id: number;
  productTitle: string;
  color?: string | null;
  size?: string | null;
  quantity: number;
  totalPriceAtPurchase: number;
  product?: { slug: string; images?: { image: string }[] } | null;
}

export interface GuestOrder {
  id: number;
  orderId: string;
  status: OrderStatus;
  total: number;
  deliveryCharge?: number | null;
  deliveryMethod?: string | null;
  createdAt: string;
  items: GuestOrderItem[];
}

export interface GuestOrdersResponse {
  data: GuestOrder[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// Guest orders are tied to this browser's visitorId, which is resolved
// asynchronously (it may need creating or upgrading first). Queries wait for
// it; `ready` with no id means there's nothing to show (e.g. signed in).
const useVisitorId = () => {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getVisitorId()
      .then((id) => alive && setVisitorId(id))
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  return { visitorId, ready };
};

// 4xx (bad id, not found) won't succeed on retry
const retryUnless4xx = (count: number, error: AxiosError) => {
  const status = error.response?.status;
  if (status && status >= 400 && status < 500) return false;
  return count < 2;
};

export const useGuestOrders = ({
  page = 1,
  limit = 10,
}: { page?: number; limit?: number } = {}) => {
  const axiosPublic = useAxiosPublic();
  const { visitorId, ready } = useVisitorId();

  const query = useQuery<GuestOrdersResponse, AxiosError>({
    queryKey: ["guest-orders", visitorId, page, limit],
    queryFn: async () => {
      const { data } = await axiosPublic.get<GuestOrdersResponse>(
        "/guest/orders",
        { params: { visitorId, page, limit } },
      );
      return data;
    },
    enabled: ready && !!visitorId,
    placeholderData: keepPreviousData,
    retry: retryUnless4xx,
    refetchOnWindowFocus: false,
  });

  return {
    orders: query.data ?? null,
    isLoading: !ready || query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

// Same response shape as the signed-in tracking view (minus invoice, which
// needs an account), so OrderTracking renders it unchanged
export const useGuestOrder = (orderId: string) => {
  const axiosPublic = useAxiosPublic();
  const { visitorId, ready } = useVisitorId();

  const query = useQuery<TrackedOrder, AxiosError>({
    queryKey: ["guest-order", visitorId, orderId],
    queryFn: async () => {
      const { data } = await axiosPublic.get<TrackedOrder>(
        `/guest/orders/${encodeURIComponent(orderId)}`,
        { params: { visitorId } },
      );
      return data;
    },
    enabled: ready && !!visitorId && !!orderId,
    retry: retryUnless4xx,
    refetchOnWindowFocus: false,
  });

  return {
    order: query.data,
    // only "loading" while there's an order to load
    isLoading: !!orderId && (!ready || query.isLoading),
    isError: query.isError,
    error: query.error,
  };
};
