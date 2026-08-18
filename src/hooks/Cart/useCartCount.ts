/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { useAuth } from "@/context/AuthContext";
import { isAuthenticated } from "@/utils/auth";
import useAxiosPublic from "../Axios/useAxiosPublic";
import { getVisitorId } from "@/utils/visitor";

// separate fetcher

const useCartCount = () => {
  const { loading } = useAuth();
  const axiosSecure = useAxiosSecure();
  const axiosPublic = useAxiosPublic();

  const fetchCartCount = async (): Promise<number> => {
    try {
      if (isAuthenticated()) {
        const res = await axiosSecure.get("/cart/count");
        return res.data;
      } else {
        const visitorId = await getVisitorId();
        // console.log(visitorId, "visitorId");
        const res = await axiosPublic.get(`/guest/cart/count/${visitorId}`);
        // console.log(res.data, "cnt giest");
        return res.data;
      }
    } catch {
      return 0; // never return undefined
    }
  };

  const {
    data: cartCount = 0,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["cartCount"],
    queryFn: () => fetchCartCount(),
    enabled: !loading,
    // staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  return { cartCount, isLoading, refetch };
};

export default useCartCount;
