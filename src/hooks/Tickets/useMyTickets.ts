"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { Ticket } from "@/types/ticket.types";

interface UseMyTicketsReturn {
  tickets: Ticket[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: AxiosError | null;
  refetch: () => void;
}

// Customer-facing ticket list — GET /support/my-tickets now returns ALL
// statuses (not just OPEN/IN_PROGRESS).
const useMyTickets = (): UseMyTicketsReturn => {
  const { loading: authLoading, token } = useAuth();
  const axiosSecure = useAxiosSecure();
  const [isTokenReady, setIsTokenReady] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => setIsTokenReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, token]);

  const fetchMyTickets = async (): Promise<Ticket[]> => {
    if (!token) throw new Error("Unauthorized");
    const res = await axiosSecure.get<Ticket[]>("/support/my-tickets");
    return res.data;
  };

  const query = useQuery<Ticket[], AxiosError>({
    queryKey: ["my-tickets", token],
    queryFn: fetchMyTickets,
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
    tickets: query.data ?? [],
    isLoading: authLoading || query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export default useMyTickets;
