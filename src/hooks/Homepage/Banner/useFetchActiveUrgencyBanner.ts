import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";

export interface UrgencyBanner {
  id: number;
  message: string;
  eventType: string | null;
  link: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const useFetchActiveUrgencyBanner = () => {
  const axiosPublic = useAxiosPublic();

  const { data, isLoading } = useQuery<UrgencyBanner | null>({
    queryKey: ["active-urgency-banner"],
    queryFn: async () => {
      const res = await axiosPublic.get("/urgency-banners/active");
      return res.data ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { banner: data ?? null, isLoading };
};

export default useFetchActiveUrgencyBanner;
