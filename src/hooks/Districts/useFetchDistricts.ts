import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { useAuth } from "@/context/AuthContext";

interface DistrictsResponse {
  id: number;
  name: string;
  deliveryFee: number;
  isCODAvailable: boolean;
}

const useFetchDistricts = () => {
  const { loading } = useAuth();
  const axiosSecure = useAxiosSecure();

  const {
    data: districts = [],
    isLoading,
    error,
    refetch,
  } = useQuery<DistrictsResponse[]>({
    queryKey: ["districts"],
    enabled: !loading, // wait until auth loading finishes
    queryFn: async () => {
      const response = await axiosSecure.get<DistrictsResponse[]>("/districts");
      return response.data;
    },
  });

  return {
    districts,
    isLoading,
    error: axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error?.message,
    refetch,
  };
};

export default useFetchDistricts;
