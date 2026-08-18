/* eslint-disable @typescript-eslint/no-explicit-any */
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";
import { useQuery } from "@tanstack/react-query";

type ActiveFilter = boolean | null | undefined;

const useFetchPromoBanners = (isActive?: ActiveFilter) => {
  const axiosPublic = useAxiosPublic();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["promo-banners", isActive],
    queryFn: async () => {
      const params: Record<string, any> = {};

      if (typeof isActive === "boolean") {
        params.isActive = isActive;
      }

      const { data } = await axiosPublic.get("/promo-banners", { params });
      return data;
    },
  });

  return { banners: data ?? [], isLoading, refetch };
};

export default useFetchPromoBanners;
