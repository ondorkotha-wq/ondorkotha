import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { useAuth } from "@/context/AuthContext";

interface Zone {
  id: number;
  name: string;
  //   cityId: number;
}

const useFetchZones = ({ id, enabled }: { id?: number; enabled: boolean }) => {
  const { loading } = useAuth();
  const axiosSecure = useAxiosSecure();

  const {
    data: zones = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Zone[]>({
    queryKey: ["zones", id],
    enabled: !loading && enabled && !!id,
    queryFn: async () => {
      const response = await axiosSecure.get<Zone[]>(`/zones?cityId=${id}`);
      return response.data;
    },
  });

  return {
    zones,
    isLoading,
    error: axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error?.message,
    refetch,
  };
};

export default useFetchZones;
