"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { AssignableStaff } from "@/types/ticket.types";

interface UseAssignableStaffReturn {
  staff: AssignableStaff[];
  isLoading: boolean;
  isError: boolean;
  error: AxiosError | null;
  refetch: () => void;
}

// Rarely changes — long staleTime so it doesn't refetch on every mount of
// the assign dropdown.
const useAssignableStaff = (): UseAssignableStaffReturn => {
  const { loading: authLoading, token } = useAuth();
  const axiosSecure = useAxiosSecure();
  const [isTokenReady, setIsTokenReady] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => setIsTokenReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, token]);

  const fetchStaff = async (): Promise<AssignableStaff[]> => {
    if (!token) throw new Error("Unauthorized");
    const res = await axiosSecure.get<AssignableStaff[]>(
      "/admin/tickets/assignable-staff",
    );
    return res.data;
  };

  const query = useQuery<AssignableStaff[], AxiosError>({
    queryKey: ["admin-tickets-assignable-staff", token],
    queryFn: fetchStaff,
    enabled: !authLoading && isTokenReady,
    staleTime: 15 * 60 * 1000,
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
    staff: query.data ?? [],
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export default useAssignableStaff;
