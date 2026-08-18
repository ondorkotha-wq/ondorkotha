import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { Invoice } from "@/types/invoice";

const useFetchInvoice = (id?: string) => {
  const axiosSecure = useAxiosSecure();

  const fetchInvoice = async (): Promise<Invoice> => {
    const { data } = await axiosSecure.get<Invoice>(`/invoices/${id}`);
    return data;
  };

  const { data, isError, error, refetch, isFetching, isLoading } = useQuery<
    Invoice,
    Error
  >({
    queryKey: ["invoice", id],
    queryFn: fetchInvoice,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    invoice: data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
};

export default useFetchInvoice;
