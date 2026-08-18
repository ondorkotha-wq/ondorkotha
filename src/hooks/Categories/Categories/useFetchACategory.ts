import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "../../Axios/useAxiosSecure";
import { Category } from "@/types/menu";

const useFetchACategory = ({
  categorySlug,
  enabled = true,
}: {
  categorySlug?: string;
  enabled?: boolean;
}) => {
  const axiosSecure = useAxiosSecure();

  const { data, isLoading } = useQuery<Category>({
    queryKey: ["individual-category", categorySlug],
    queryFn: async () => {
      const res = await axiosSecure.get(`/category/${categorySlug}`);
      return res.data;
    },
    enabled: !!categorySlug && enabled, // only fetch if categorySlug exists and enabled
    retry: 1, // retry once on failure
  });

  return { categoryData: data || null, isLoading };
};

export default useFetchACategory;

