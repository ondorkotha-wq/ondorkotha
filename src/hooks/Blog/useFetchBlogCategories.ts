import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "../Axios/useAxiosPublic";

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const useFetchBlogCategories = () => {
  const axiosPublic = useAxiosPublic();

  const {
    data: blogCategories = [],
    isLoading,
    refetch,
    isError,
  } = useQuery<BlogCategory[]>({
    queryKey: ["blogCategories"],
    queryFn: async () => {
      const res = await axiosPublic.get("/blogs/categories");
      return res.data;
    },
  });

  return {
    blogCategories,
    isLoading,
    isError,
    refetch,
  };
};

export default useFetchBlogCategories;
