/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useFetchProducts.ts
import {
  keepPreviousData,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { isAuthenticated } from "@/utils/auth";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";
import { RelatedProduct } from "../RelatedProducts/useFetchRelatedProducts";
import { getVisitorId } from "@/utils/visitor";

const useFetchRecentlyViewedProducts = ({
  limit = 10,
  enabled = true,
}: {
  limit?: number;
  enabled?: boolean | null;
}) => {
  const axiosPublic = useAxiosPublic();
  const axiosSecure = useAxiosSecure();

  const fetchProducts = async (): Promise<RelatedProduct[]> => {
    let response: any = {};
    const visitorId = await getVisitorId();
    console.log(visitorId, "visitorId");

    if (isAuthenticated()) {
      response = await axiosSecure.get<RelatedProduct[]>(
        `/product/recently-viewed?limit=${limit}`,
      );
    } else {
      response = await axiosPublic.get<RelatedProduct[]>(
        `/product/recently-viewed?limit=${limit}&&visitorId=${visitorId}`,
      );
    }
    // Build query parameters, excluding null/undefined values

    return response.data;
  };

  // Construct query key for React Query caching
  const queryKey = ["recently-viewed-products"] as const;

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

export default useFetchRecentlyViewedProducts;
