import { useQuery } from "@tanstack/react-query";
import { Product } from "@/types/product.types";
import useAxiosPublic from "../Axios/useAxiosPublic";

const useFetchAProduct = (slug?: string) => {
  const axiosPublic = useAxiosPublic();

  const fetchAProduct = async (): Promise<Product> => {
    const { data } = await axiosPublic.get<Product>(`/product/${slug}`);
    return data;
  };

  const { data, isError, error, refetch, isFetching, isLoading } = useQuery<
    Product,
    Error
  >({
    queryKey: ["product", slug],
    queryFn: fetchAProduct,
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    product: data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
};

export default useFetchAProduct;
