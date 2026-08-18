import { useQuery } from "@tanstack/react-query";
import { LabelSize } from "@/types/settings";
import useAxiosPublic from "../Axios/useAxiosPublic";

const useFetchLabelSizes = () => {
  const axiosPublic = useAxiosPublic();

  const fetchLabelSizes = async (): Promise<LabelSize[]> => {
    const { data } = await axiosPublic.get<LabelSize[]>("/label-sizes");
    return data;
  };

  const { data, isLoading, isError, refetch } = useQuery<LabelSize[], Error>({
    queryKey: ["label-sizes"],
    queryFn: fetchLabelSizes,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return { labelSizes: data ?? [], isLoading, isError, refetch };
};

export default useFetchLabelSizes;
