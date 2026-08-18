import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { useAuth } from "@/context/AuthContext";

interface Area {
  id: number;
  name: string;
}

const useFetchAreaList = ({
  id,
  enabled,
}: {
  id?: number;
  enabled: boolean;
}) => {
  const { loading } = useAuth();
  const axiosSecure = useAxiosSecure();

  const {
    data: areas = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Area[]>({
    queryKey: ["areas", id],
    enabled: !loading && enabled && !!id,
    queryFn: async () => {
      const response = await axiosSecure.get<Area[]>(`/areas?zoneId=${id}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  return {
    areas,
    isLoading,
    error: axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error?.message,
    refetch,
  };
};

export default useFetchAreaList;
