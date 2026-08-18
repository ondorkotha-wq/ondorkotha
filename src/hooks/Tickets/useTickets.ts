/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import useAxiosSecure from "../Axios/useAxiosSecure";
import {
  PaginatedTickets,
  TicketPriority,
  TicketStatus,
} from "@/types/ticket.types";

export interface GetTicketsOptions {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: number;
  unassigned?: boolean;
  search?: string;
}

interface UseTicketsReturn {
  tickets: PaginatedTickets | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: AxiosError | null;
  refetch: () => void;
}

const useTickets = (options?: GetTicketsOptions): UseTicketsReturn => {
  const { loading: authLoading, token } = useAuth();
  const axiosSecure = useAxiosSecure();
  const [isTokenReady, setIsTokenReady] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => setIsTokenReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, token]);

  const fetchTickets = async (): Promise<PaginatedTickets> => {
    if (!token) throw new Error("Unauthorized");

    const params: Record<string, any> = {};
    if (options?.page) params.page = options.page;
    if (options?.limit) params.limit = options.limit;
    if (options?.status) params.status = options.status;
    if (options?.priority) params.priority = options.priority;
    if (options?.assignedToId) params.assignedToId = options.assignedToId;
    if (options?.unassigned) params.unassigned = options.unassigned;
    if (options?.search) params.search = options.search;

    const res = await axiosSecure.get<PaginatedTickets>("/admin/tickets", {
      params,
    });
    return res.data;
  };

  const query = useQuery<PaginatedTickets, AxiosError>({
    queryKey: ["admin-tickets", options, token],
    queryFn: fetchTickets,
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
    tickets: query.data ?? null,
    isLoading: authLoading || query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export default useTickets;
