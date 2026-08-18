"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { ReturnRequest } from "@/types/refund.types";

interface UseMyReturnRequestsReturn {
  returnRequests: ReturnRequest[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: AxiosError | null;
  refetch: () => void;
}

const useMyReturnRequests = (orderId?: string): UseMyReturnRequestsReturn => {
  const { loading: authLoading, token } = useAuth();
  const axiosSecure = useAxiosSecure();
  const [isTokenReady, setIsTokenReady] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => setIsTokenReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, token]);

  const fetchMyReturnRequests = async (): Promise<ReturnRequest[]> => {
    if (!token) throw new Error("Unauthorized");

    const res = await axiosSecure.get<ReturnRequest[]>(
      "/orders/return-requests",
      { params: orderId ? { orderId } : undefined },
    );
    return res.data;
  };

  const query = useQuery<ReturnRequest[], AxiosError>({
    queryKey: ["my-return-requests", orderId, token],
    queryFn: fetchMyReturnRequests,
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
    returnRequests: query.data ?? [],
    isLoading: authLoading || query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export default useMyReturnRequests;
