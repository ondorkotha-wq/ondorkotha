// hooks/useWishlist.ts
import {
  keepPreviousData,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { Product } from "@/types/product.types";

/**
 * Parameters for fetching wishlist
 */
interface FetchWishlistParams {
  page?: number;
  limit?: number;
  search?: string;
  order?: "asc" | "desc";
  sortBy?: string;
}

/**
 * Metadata for paginated wishlist response
 */
interface WishlistMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * API response structure
 */
interface WishlistResponse {
  data: Product[];
  meta: WishlistMeta;
}

/**
 * Hook return type
 */
interface UseWishlistReturn {
  wishlist: Product[];
  meta: WishlistMeta;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

const useWishlist = (params: FetchWishlistParams = {}): UseWishlistReturn => {
  const axiosSecure = useAxiosSecure();

  const fetchWishlist = async (): Promise<WishlistResponse> => {
    const queryParams: Record<string, string | number> = {};

    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;

    if (params.search?.trim()) {
      queryParams.search = params.search.trim();
    }

    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.order) queryParams.order = params.order;

    const response = await axiosSecure.get<WishlistResponse>("/wishlist", {
      params: queryParams,
    });

    return response.data;
  };

  const queryKey = [
    "wishlist",
    params.page ?? 1,
    params.limit ?? 10,
    params.search ?? "",
    params.sortBy ?? "",
    params.order ?? "",
  ] as const;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  }: UseQueryResult<WishlistResponse, AxiosError> = useQuery({
    queryKey,
    queryFn: fetchWishlist,
    placeholderData: keepPreviousData,
    // staleTime: 2 * 60 * 1000,
    // gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const defaultMeta: WishlistMeta = {
    total: 0,
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    totalPages: 1,
  };

  return {
    wishlist: data?.data ?? [],
    meta: data?.meta ?? defaultMeta,
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    refetch,
  };
};

export default useWishlist;
