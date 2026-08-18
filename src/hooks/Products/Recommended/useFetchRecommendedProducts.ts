/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useFetchProducts.ts
import {
  keepPreviousData,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { RelatedProduct } from "../RelatedProducts/useFetchRelatedProducts";

const useFetchRecommendedProducts = ({
  limit = 10,
  enabled = true,
}: {
  limit?: number;
  enabled?: boolean | null;
}) => {
  const axiosSecure = useAxiosSecure();

  const fetchProducts = async (): Promise<RelatedProduct[]> => {
    const response = await axiosSecure.get<RelatedProduct[]>(
      `/product/recommended?limit=${limit}`,
    );

    return response.data;
  };

  // Construct query key for React Query caching
  const queryKey = ["recommended-products"] as const;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  }: UseQueryResult<RelatedProduct[], AxiosError> = useQuery({
    queryKey,
    queryFn: fetchProducts,
    enabled: !!enabled,
    placeholderData: keepPreviousData, // React Query v5 syntax
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime in v5)
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

export default useFetchRecommendedProducts;
