import { useQuery } from "@tanstack/react-query";
import { BlogPost } from "@/types/blog";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";

type FetchBlogsAdminParams = {
  activeCategory?: string | null;
  page?: number;
  limit?: number;
  search?: string;
  published?: "true" | "false" | null;
};

type BlogAdminResponse = {
  data: BlogPost[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    total: number;
    published: number;
    draft: number;
  };
};

const useFetchBlogsAdmin = ({
  activeCategory,
  page = 1,
  limit = 10,
  search = "",
  published = null,
}: FetchBlogsAdminParams) => {
  const axiosSecure = useAxiosSecure();

  const { data, isLoading, refetch, isError } = useQuery<BlogAdminResponse>({
    queryKey: ["adminBlogPosts", activeCategory, page, limit, search, published],
    queryFn: async () => {
      const res = await axiosSecure.get(`/blogs/admin/all`, {
        params: {
          activeCategory,
          page,
          limit,
          search,
          ...(published !== null && { published }),
        },
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });

  return {
    blogPosts: data?.data ?? [],
    meta: data?.meta,
    summary: data?.summary,
    isLoading,
    isError,
    refetch,
  };
};

export default useFetchBlogsAdmin;
