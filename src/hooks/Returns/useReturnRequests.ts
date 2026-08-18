/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import useAxiosSecure from "../Axios/useAxiosSecure";
import {
  PaginatedReturnRequests,
  ReturnRequestStatus,
} from "@/types/refund.types";

export interface GetReturnRequestsOptions {
  page?: number;
  limit?: number;
  status?: ReturnRequestStatus;
  search?: string;
}

interface UseReturnRequestsReturn {
  returnRequests: PaginatedReturnRequests | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: AxiosError | null;
  refetch: () => void;
}

const useReturnRequests = (
  options?: GetReturnRequestsOptions,
): UseReturnRequestsReturn => {
  const { loading: authLoading, token } = useAuth();
  const axiosSecure = useAxiosSecure();
  const [isTokenReady, setIsTokenReady] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => setIsTokenReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, token]);

  const fetchReturnRequests = async (): Promise<PaginatedReturnRequests> => {
    if (!token) throw new Error("Unauthorized");

    const params: Record<string, any> = {};
    if (options?.page) params.page = options.page;
    if (options?.limit) params.limit = options.limit;
    if (options?.status) params.status = options.status;
    if (options?.search) params.search = options.search;

    const res = await axiosSecure.get<PaginatedReturnRequests>(
      "/return-requests",
      { params },
    );
    return res.data;
  };

  const query = useQuery<PaginatedReturnRequests, AxiosError>({
    queryKey: ["return-requests", options, token],
    queryFn: fetchReturnRequests,
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
    returnRequests: query.data ?? null,
    isLoading: authLoading || query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export default useReturnRequests;
