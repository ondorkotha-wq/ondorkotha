import useAxiosPublic from "../Axios/useAxiosPublic";
import { useQuery } from "@tanstack/react-query";
import { Color } from "@/types/product.types";
import { Material } from "./useFetchMaterials";

interface CategoryFilters {
  materials: Material[];
  colors: Color[];
}

const useFetchCategoryFilters = ({
  slug,
  type,
}: {
  slug: string;
  type: "series" | "subcategory";
}) => {
  const axiosPublic = useAxiosPublic();

  const { data, isLoading } = useQuery<CategoryFilters>({
    queryKey: ["category-filters", type, slug],
    enabled: !!slug,
    staleTime: Infinity,
    queryFn: async () => {
      const response = await axiosPublic.get<CategoryFilters>(
        `/${type}/${slug}/filters`,
      );
      return response.data;
    },
  });

  return {
    colors: data?.colors ?? [],
    materials: data?.materials ?? [],
    isLoading,
  };
};

export default useFetchCategoryFilters;
