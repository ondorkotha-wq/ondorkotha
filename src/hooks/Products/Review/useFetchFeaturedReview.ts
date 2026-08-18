import { useQuery } from "@tanstack/react-query";
import { Review } from "@/types/product.types";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";

const useFetchFeaturedReview = () => {
  const axiosPublic = useAxiosPublic();

  const fetchReview = async (): Promise<Review> => {
    const { data } = await axiosPublic.get<Review>(`/product/reviews/random-featured`);
    return data;
  };

  const { data, isError, error, refetch, isFetching, isLoading } = useQuery<
    Review,
    Error
  >({
    queryKey: ["featured-review"],
    queryFn: fetchReview,
    // enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    review: data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
};

export default useFetchFeaturedReview;
