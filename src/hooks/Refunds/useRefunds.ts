/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { PaginatedRefunds, RefundStatus } from "@/types/refund.types";

export interface GetRefundsOptions {
  page?: number;
  limit?: number;
  status?: RefundStatus;
  search?: string;
}

interface UseRefundsReturn {
  refunds: PaginatedRefunds | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: AxiosError | null;
  refetch: () => void;
}

const useRefunds = (options?: GetRefundsOptions): UseRefundsReturn => {
  const { loading: authLoading, token } = useAuth();
  const axiosSecure = useAxiosSecure();
  const [isTokenReady, setIsTokenReady] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => setIsTokenReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, token]);

  const fetchRefunds = async (): Promise<PaginatedRefunds> => {
    if (!token) throw new Error("Unauthorized");

    const params: Record<string, any> = {};
    if (options?.page) params.page = options.page;
    if (options?.limit) params.limit = options.limit;
    if (options?.status) params.status = options.status;
    if (options?.search) params.search = options.search;

    const res = await axiosSecure.get<PaginatedRefunds>("/refunds", {
      params,
    });
    return res.data;
  };

  const query = useQuery<PaginatedRefunds, AxiosError>({
    queryKey: ["refunds", options, token],
    queryFn: fetchRefunds,
    enabled: !authLoading && isTokenReady,
    staleTime: 60 * 1000,
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
    refunds: query.data ?? null,
    isLoading: authLoading || query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export default useRefunds;
