import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "../../Axios/useAxiosSecure";
import { toast } from "react-hot-toast";

interface SubCategory {
  id: number;
  name: string;
  slug: string;
  image?: string;
}

const useFetchSeriesWiseSubcategories = ({
  seriesSlug,
  enabled = true,
}: {
  seriesSlug?: string;
  enabled?: boolean;
}) => {
  const axiosSecure = useAxiosSecure();

  const { data, isLoading } = useQuery<SubCategory[]>({
    queryKey: ["seriesSubcategories", seriesSlug],
    queryFn: async () => {
      const res = await axiosSecure.get(`/series/${seriesSlug}/subcategories`);
      return res.data;
    },
    enabled: !!seriesSlug && enabled, // only fetch if seriesSlug exists and enabled
    // onError: () => {
    //   toast.error("Failed to load subcategories");
    // },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1, // retry once on failure
  });

  return { subCategoryList: data || [], isLoading };
};

export default useFetchSeriesWiseSubcategories;

