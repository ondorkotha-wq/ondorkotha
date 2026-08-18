import { useQuery } from "@tanstack/react-query";
import { InvoiceSettings } from "@/types/settings";
import useAxiosPublic from "../Axios/useAxiosPublic";

const useFetchInvoiceSettings = () => {
  const axiosPublic = useAxiosPublic();

  const fetchInvoiceSettings = async (): Promise<InvoiceSettings> => {
    const { data } = await axiosPublic.get<InvoiceSettings>(
      "/settings/invoice",
    );
    return data;
  };

  const { data, isLoading, isError, refetch } = useQuery<
    InvoiceSettings,
    Error
  >({
    queryKey: ["settings", "invoice"],
    queryFn: fetchInvoiceSettings,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return { invoiceSettings: data, isLoading, isError, refetch };
};

export default useFetchInvoiceSettings;
