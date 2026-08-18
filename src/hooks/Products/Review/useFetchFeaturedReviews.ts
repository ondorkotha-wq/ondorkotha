import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";
import { Review } from "@/types/product.types";

const useFetchFeaturedReviews = () => {
  const axiosPublic = useAxiosPublic();

  const fetchReviews = async (): Promise<Review[]> => {
    const { data } = await axiosPublic.get<Review[]>(`/product/reviews/all-featured`);
    return data;
  };

  const { data, isError, error, refetch, isFetching, isLoading } = useQuery<
    Review[],
    Error
  >({
    queryKey: ["all-featured-reviews"],
    queryFn: fetchReviews,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    reviews: data ?? [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
};

export default useFetchFeaturedReviews;