"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { TicketDetail } from "@/types/ticket.types";

interface UseMyTicketDetailReturn {
  ticket: TicketDetail | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: AxiosError | null;
  refetch: () => void;
}

// Customer-facing ticket detail — GET /support/ticket/:id. Internal notes
// are already excluded server-side.
const useMyTicketDetail = (id?: number | string): UseMyTicketDetailReturn => {
  const { loading: authLoading, token } = useAuth();
  const axiosSecure = useAxiosSecure();
  const [isTokenReady, setIsTokenReady] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => setIsTokenReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, token]);

  const fetchTicket = async (): Promise<TicketDetail> => {
    if (!token) throw new Error("Unauthorized");
    const res = await axiosSecure.get<TicketDetail>(`/support/ticket/${id}`);
    return res.data;
  };

  const query = useQuery<TicketDetail, AxiosError>({
    queryKey: ["my-ticket-detail", id, token],
    queryFn: fetchTicket,
    enabled: !authLoading && isTokenReady && !!id,
    staleTime: 30 * 1000,
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
    ticket: query.data ?? null,
    isLoading: authLoading || query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export default useMyTicketDetail;
