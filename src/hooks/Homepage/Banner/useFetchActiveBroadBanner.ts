/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";

const useFetchActiveBroadBanner = () => {
  const axiosSecure = useAxiosSecure();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["active-broad-banners"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/broad-banner/active");
      return data;
    },
  });

  return { banner: data ?? null, isLoading, refetch };
};

export default useFetchActiveBroadBanner;
