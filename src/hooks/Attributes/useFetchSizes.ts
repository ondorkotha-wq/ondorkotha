import useAxiosPublic from "../Axios/useAxiosPublic";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { ProductSizeRelation } from "@/types/product.types";

const useFetchSizes = ({
  isActive = true,
  isEnabled = true,
}: {
  isActive?: boolean | null;
  isEnabled?: boolean;
}) => {
  const axiosPublic = useAxiosPublic();

  const {
    data: sizes = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ProductSizeRelation[]>({
    queryKey: ["all-sizes", isActive],
    enabled: !!isEnabled, // wait until auth loading finishes
    queryFn: async () => {
      const response = await axiosPublic.get<ProductSizeRelation[]>(
        `/sizes?isActive=${isActive}`,
      );
      return response.data;
    },
  });

  return {
    sizes,
    isLoading,
    error: axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error?.message,
    refetch,
  };
};

export default useFetchSizes;
