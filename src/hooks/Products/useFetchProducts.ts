// hooks/useFetchProducts.ts
import {
  keepPreviousData,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import { FetchProductsParams, Product } from "@/types/product.types";
import useAxiosPublic from "../Axios/useAxiosPublic";
import { AxiosError } from "axios";

/**
 * Metadata for paginated product response
 */
interface ProductsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Response structure from the products API
 */
interface ProductsResponse {
  data: Product[];
  meta: ProductsMeta;
}

/**
 * Return type for the useFetchProducts hook
 */
interface UseFetchProductsReturn {
  products: Product[];
  meta: ProductsMeta;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

const useFetchProducts = (
  params: FetchProductsParams = {},
): UseFetchProductsReturn => {
  const axiosPublic = useAxiosPublic();

  const fetchProducts = async (): Promise<ProductsResponse> => {
    // Build query parameters, excluding null/undefined values
    const queryParams: Record<string, string | number | boolean> = {};

    if (params.page !== undefined && params.page !== null) {
      queryParams.page = params.page;
    }

    if (params.limit !== undefined && params.limit !== null) {
      queryParams.limit = params.limit;
    }

    if (
      params.search !== undefined &&
      params.search !== null &&
      params.search.trim() !== ""
    ) {
      queryParams.search = params.search.trim();
    }

    if (typeof params.isActive === "boolean") {
      queryParams.isActive = params.isActive;
    }

    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.order) queryParams.order = params.order;
    if (params?.thumb) queryParams.thumb = params.thumb;
    if (params?.includeOutOfStock)
      queryParams.includeOutOfStock = params.includeOutOfStock;

    // Fix: Use plural parameter names as expected by backend
    if (params?.colorIds?.length)
      queryParams.colorIds = params.colorIds.join(",");
    if (params?.materialIds?.length)
      queryParams.materialIds = params.materialIds.join(",");
    if (params?.subCategoryIds?.length)
      queryParams.subCategoryIds = params.subCategoryIds.join(",");

    if (params?.minPrice !== undefined) queryParams.minPrice = params.minPrice;

    if (params?.maxPrice !== undefined) queryParams.maxPrice = params.maxPrice;

    const response = await axiosPublic.get<ProductsResponse>("/product/all", {
      params: queryParams,
    });

    if (process.env.NODE_ENV === "development") {
      console.log("Fetched products:", response.data);
    }

    return response.data;
  };

  // Construct query key for React Query caching
  const queryKey = [
    "products",
    params.page ?? 1,
    params.limit ?? null,
    params.search ?? "",
    params.isActive ?? null,
    params?.order,
    params?.thumb,
    params?.sortBy,
    params?.colorIds?.join(",") ?? "",
    params?.materialIds?.join(",") ?? "",
    params?.subCategoryIds?.join(",") ?? "",
    params?.minPrice ?? null,
    params?.maxPrice ?? null,
    params?.includeOutOfStock ?? false,
  ] as const;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  }: UseQueryResult<ProductsResponse, AxiosError> = useQuery({
    queryKey,
    queryFn: fetchProducts,
    enabled: params.enabled ?? true,
    placeholderData: keepPreviousData, // React Query v5 syntax
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime in v5)
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const defaultMeta: ProductsMeta = {
    total: 0,
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    totalPages: 1,
  };

  return {
    products: data?.data ?? [],
    meta: data?.meta ?? defaultMeta,
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    refetch,
  };
};

export default useFetchProducts;
