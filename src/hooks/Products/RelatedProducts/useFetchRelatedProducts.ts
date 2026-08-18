// hooks/useFetchProducts.ts
import {
  keepPreviousData,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";

export interface RelatedProductImage {
  id?: number;
  image: string;
  serialNo?: number;
  alt?: string | null;
}

export interface RelatedProduct {
  id: number;
  title: string;
  slug: string;
  price?: number;
  basePrice?: number;
  rating?: number | null | string;
  images: RelatedProductImage[];
}

interface RelatedProductsResponse {
  data: RelatedProduct[];
}

interface UseFetchProductsReturn {
  relatedProducts: RelatedProduct[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

const useFetchRelatedProducts = ({
  productSlug,
  productIds,
  categoryIds,
  categorySlug,
  isEnabled = true,
}: {
  productSlug?: string;
  productIds?: string;
  categorySlug?: string;
  categoryIds?: string;
  isEnabled?: boolean | null;
}): UseFetchProductsReturn => {
  const axiosPublic = useAxiosPublic();

  // console.log(categoryIds, categorySlug, "categoryIds");

  const fetchRelatedProducts = async (): Promise<RelatedProduct[]> => {
    const response = await axiosPublic.get<RelatedProduct[]>(
      `/product/you-may-also-like?productSlug=${productSlug && productSlug}&productIds=${productIds && productIds}&categoryIds=${categoryIds && categoryIds}&categorySlug=${categorySlug && categorySlug}`,
    );

    return response.data;
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  }: UseQueryResult<RelatedProduct[], AxiosError> = useQuery({
    queryKey: ["related-products", productSlug, productIds, categoryIds, categorySlug],
    queryFn: fetchRelatedProducts,
    enabled: !!isEnabled,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  return {
    relatedProducts: data ?? [],
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    refetch,
  };
};

export default useFetchRelatedProducts;
