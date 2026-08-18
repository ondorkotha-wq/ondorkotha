import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";
import { FlashSale } from "@/types/product.types";

const useFetchActiveFlashSale = () => {
  const axiosPublic = useAxiosPublic();

  const { data, isLoading } = useQuery<FlashSale | null>({
    queryKey: ["active-flash-sale"],
    queryFn: async () => {
      const res = await axiosPublic.get("/flash-sales/active");
      return res.data ?? null;
    },
    staleTime: 3 * 60 * 1000,
  });

  return { flashSale: data ?? null, isLoading };
};

export default useFetchActiveFlashSale;
