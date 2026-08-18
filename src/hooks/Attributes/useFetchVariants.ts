import useAxiosPublic from "../Axios/useAxiosPublic";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Variant } from "@/types/product.types";

const useFetchVariants = ({
  isActive = true,
  isEnabled = true,
  needSize = true
}: {
  isActive?: boolean | null;
  isEnabled?: boolean;
  needSize?:boolean
}) => {
  const axiosPublic = useAxiosPublic();

  const {
    data: variants = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Variant[]>({
    queryKey: ["all-variants", isActive],
    enabled: !!isEnabled, // wait until auth loading finishes
    queryFn: async () => {
      const response = await axiosPublic.get<Variant[]>(
        `/variants?isActive=${isActive}&&needSizes=${needSize}`,
      );

      return response.data;
    },
  });

  return {
    variants,
    isLoading,
    error: axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error?.message,
    refetch,
  };
};

export default useFetchVariants;
