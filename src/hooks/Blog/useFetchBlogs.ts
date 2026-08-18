import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "../Axios/useAxiosPublic";
import { BlogPost } from "@/types/blog";

type FetchBlogsParams = {
  activeCategory?: string | null;
  page?: number;
  limit?: number;
  search?: string;
};

type BlogResponse = {
  data: BlogPost[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const useFetchBlogs = ({
  activeCategory,
  page = 1,
  limit = 10,
  search = "",
}: FetchBlogsParams) => {
  const axiosPublic = useAxiosPublic();

  const { data, isLoading, refetch, isError } = useQuery<BlogResponse>({
    queryKey: ["blogPosts", activeCategory, page, limit, search],
    queryFn: async () => {
      const res = await axiosPublic.get(`/blogs`, {
        params: {
          activeCategory,
          page,
          limit,
          search,
        },
      });

      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });

  return {
    blogPosts: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    isError,
    refetch,
  };
};

export default useFetchBlogs;
