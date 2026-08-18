import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "../../Axios/useAxiosSecure";
import { Series } from "@/types/menu";

const useFetchASeries = ({
  seriesSlug,
  enabled = true,
}: {
  seriesSlug?: string;
  enabled?: boolean;
}) => {
  const axiosSecure = useAxiosSecure();

  const { data, isLoading } = useQuery<Series>({
    queryKey: ["individual-series", seriesSlug],
    queryFn: async () => {
      const res = await axiosSecure.get(`/series/${seriesSlug}`);
      return res.data;
    },
    enabled: !!seriesSlug && enabled, // only fetch if seriesSlug exists and enabled
    retry: 1, // retry once on failure
  });

  return { seriesData: data || null, isLoading };
};

export default useFetchASeries;

