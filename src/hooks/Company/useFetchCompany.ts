import { useQuery } from "@tanstack/react-query";
import { CompanyInfo } from "@/types/company";
import useAxiosPublic from "../Axios/useAxiosPublic";

const useFetchCompany = () => {
  const axiosPublic = useAxiosPublic();

  const fetchCompany = async (): Promise<CompanyInfo> => {
    const { data } = await axiosPublic.get<CompanyInfo>("/company");
    return data;
  };

  const { data, isLoading, isError } = useQuery<CompanyInfo, Error>({
    queryKey: ["company"],
    queryFn: fetchCompany,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  return { company: data, isLoading, isError };
};

export default useFetchCompany;
