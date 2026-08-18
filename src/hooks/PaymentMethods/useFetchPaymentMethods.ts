import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { useAuth } from "@/context/AuthContext";

export interface PaymentMethodConfig {
  id: number;
  method: string;
  gateway: string;
  isEnabled: boolean;
  isSandbox: boolean;
  displayName: string;
  displayOrder: number;
  minAmount: number | null;
  maxAmount: number | null;
  convenienceFeeType: "FIXED" | "PERCENTAGE" | null;
  convenienceFeeValue: number | null;
  availableForCODOnly: boolean;
}

const useFetchPaymentMethods = () => {
  const { loading } = useAuth();
  const axiosSecure = useAxiosSecure();

  const {
    data: paymentMethods = [],
    isLoading,
    error,
    refetch,
  } = useQuery<PaymentMethodConfig[]>({
    queryKey: ["payment-methods", "all"],
    enabled: !loading,
    queryFn: async () => {
      const response = await axiosSecure.get<PaymentMethodConfig[]>(
        "/payment-methods/all",
      );
      return response.data;
    },
  });

  return {
    paymentMethods,
    isLoading,
    error: axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error?.message,
    refetch,
  };
};

export default useFetchPaymentMethods;
