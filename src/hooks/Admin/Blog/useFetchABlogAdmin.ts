import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { BlogPost } from "@/types/blog";

const useFetchABlogAdmin = (slug?: string) => {
  const axiosSecure = useAxiosSecure();

  const fetchABlog = async (): Promise<BlogPost> => {
    const { data } = await axiosSecure.get<BlogPost>(
      `/blogs/admin/by-slug/${slug}`,
    );
    return data;
  };

  const { data, isError, error, refetch, isFetching, isLoading } = useQuery<
    BlogPost,
    Error
  >({
    queryKey: ["a-blog-admin", slug],
    queryFn: fetchABlog,
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    blog: data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
};

export default useFetchABlogAdmin;
