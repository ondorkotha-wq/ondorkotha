/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";

type ActiveFilter = boolean | null | undefined;

const useFetchHomepageBanners = (isActive?: ActiveFilter) => {
  const axiosSecure = useAxiosSecure();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["homepage-banners", isActive],
    queryFn: async () => {
      const params: Record<string, any> = {};

      if (typeof isActive === "boolean") {
        params.isActive = isActive;
      }

      const { data } = await axiosSecure.get("/homepage-banners", { params });
      return data;
    },
  });

  return { banners: data ?? [], isLoading, refetch };
};

export default useFetchHomepageBanners;
