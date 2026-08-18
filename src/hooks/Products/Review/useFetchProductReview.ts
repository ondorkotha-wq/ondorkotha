// hooks/useFetchProductReview.ts
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Review } from "@/types/product.types";
import { AxiosError } from "axios";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";

interface ProductReviewsResponse {
  reviews: Review[];
  ratingCount: number;
  averageRating: number;
}

interface UseFetchProductReviewParams {
  slug?: string;
  minRating?: number;
  maxRating?: number;
  isHidden?: boolean | null;
  isFeatured?: boolean;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
}

interface UseFetchProductReviewReturn {
  reviews: Review[];
  ratingCount: number;
  averageRating: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

const useFetchProductReview = ({
  slug,
  minRating,
  maxRating,
  isHidden,
  isFeatured,
  fromDate,
  toDate,
}: UseFetchProductReviewParams): UseFetchProductReviewReturn => {
  const axiosSecure = useAxiosSecure();

  const fetchProductReviews = async (): Promise<ProductReviewsResponse> => {
    // Build query params
    const params = new URLSearchParams();
    if (slug) params.append("productSlug", slug);
    if (minRating !== undefined) params.append("minRating", String(minRating));
    if (maxRating !== undefined) params.append("maxRating", String(maxRating));
    if (isHidden !== undefined) params.append("isHidden", String(isHidden));
    if (isFeatured !== undefined)
      params.append("isFeatured", String(isFeatured));
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    const response = await axiosSecure.get<ProductReviewsResponse>(
      `/product/reviews?${params.toString()}`,
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
  }: UseQueryResult<ProductReviewsResponse, AxiosError> = useQuery({
    queryKey: [
      "product-reviews",
      slug,
      minRating,
      maxRating,
      isHidden,
      isFeatured,
      fromDate,
      toDate,
    ],
    queryFn: fetchProductReviews,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    reviews: data?.reviews ?? [],
    ratingCount: data?.ratingCount ?? 0,
    averageRating: data?.averageRating ?? 0,
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    refetch,
  };
};

export default useFetchProductReview;
