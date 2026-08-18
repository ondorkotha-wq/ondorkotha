import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";

export interface FeaturedCategoryTile {
  id: number;
  image: string;
  sortOrder: number;
  subcategory: {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    category: {
      id: number;
      name: string;
      slug: string;
      series: { id: number; name: string; slug: string };
    };
  };
}

const useFetchFeaturedCategories = () => {
  const axiosPublic = useAxiosPublic();

  const { data, isLoading } = useQuery<FeaturedCategoryTile[]>({
    queryKey: ["featured-categories"],
    queryFn: async () => {
      const res = await axiosPublic.get("/featured-categories");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { tiles: data ?? [], isLoading };
};

export default useFetchFeaturedCategories;
