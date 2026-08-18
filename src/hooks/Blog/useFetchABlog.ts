import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "../Axios/useAxiosPublic";
import { BlogPost } from "@/types/blog";

const useFetchABlog = (slug?: string) => {
  const axiosPublic = useAxiosPublic();

  const fetchABlog = async (): Promise<BlogPost> => {
    const { data } = await axiosPublic.get<BlogPost>(`/blogs/${slug}`);
    return data;
  };

  const { data, isError, error, refetch, isFetching, isLoading } = useQuery<
    BlogPost,
    Error
  >({
    queryKey: ["a-blog", slug],
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

export default useFetchABlog;
