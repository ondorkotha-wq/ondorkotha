import { useQuery } from "@tanstack/react-query";
import { PrintingSettings } from "@/types/settings";
import useAxiosPublic from "../Axios/useAxiosPublic";

const useFetchPrintingSettings = () => {
  const axiosPublic = useAxiosPublic();

  const fetchPrintingSettings = async (): Promise<PrintingSettings> => {
    const { data } = await axiosPublic.get<PrintingSettings>(
      "/settings/printing",
    );
    return data;
  };

  const { data, isLoading, isError, refetch } = useQuery<
    PrintingSettings,
    Error
  >({
    queryKey: ["settings", "printing"],
    queryFn: fetchPrintingSettings,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return { printingSettings: data, isLoading, isError, refetch };
};

export default useFetchPrintingSettings;
