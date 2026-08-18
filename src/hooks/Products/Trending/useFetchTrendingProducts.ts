import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";
import { RelatedProduct } from "../RelatedProducts/useFetchRelatedProducts";

const useFetchTrendingProducts = ({
  limit = 10,
  enabled = true,
}: {
  limit?: number;
  enabled?: boolean;
} = {}) => {
  const axiosPublic = useAxiosPublic();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<
    RelatedProduct[]
  >({
    queryKey: ["trending-products", limit],
    queryFn: async () => {
      const response = await axiosPublic.get<RelatedProduct[]>(
        `/product/trending?limit=${limit}`,
      );
      return response.data;
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  return {
    products: data ?? [],
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    refetch,
  };
};

export default useFetchTrendingProducts;
