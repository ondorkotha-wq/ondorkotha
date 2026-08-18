import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "../../Axios/useAxiosSecure";
import { SubCategory } from "@/types/menu";

const useFetchASubcategory = ({
  categorySlug,
  enabled = true,
}: {
  categorySlug?: string;
  enabled?: boolean;
}) => {
  const axiosSecure = useAxiosSecure();

  const { data, isLoading } = useQuery<SubCategory>({
    queryKey: ["individual-subcategory", categorySlug],
    queryFn: async () => {
      const res = await axiosSecure.get(`/subcategory/${categorySlug}`);
      console.log(res.data, "subcategory");
      return res.data;
    },
    enabled: !!categorySlug && enabled,
    retry: 1, // retry once on failure
  });

  return { subcategoryData: data || null, isLoading };
};

export default useFetchASubcategory;
