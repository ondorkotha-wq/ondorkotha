import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { useAuth } from "@/context/AuthContext";

const useIsWished = (slug: string) => {
  const axiosSecure = useAxiosSecure();
  const { token, loading: authLoading } = useAuth();

  const {
    data: isWished = false,
    isLoading,
    refetch,
  } = useQuery({
    // Unique key for caching. Includes token to reset cache on logout
    queryKey: ["isWished", slug, token],
    queryFn: async () => {
      const res = await axiosSecure.get(`wishlist/isWIshed/${slug}`);
      return res.data.isWished;
    },
    enabled: !authLoading && !!token && !!slug,
    retry: false,
  });

  return { isWished, isLoading: isLoading || authLoading, refetch };
};

export default useIsWished;
