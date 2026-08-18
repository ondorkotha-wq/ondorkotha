import { useQuery, UseQueryResult } from "@tanstack/react-query";
import useAxiosPublic from "../Axios/useAxiosPublic";
import { AxiosError } from "axios";

export interface Tag {
  id: number;
  name: string;
}

interface FetchTagsParams {
  search?: string;
  limit?: number;
  enabled?: boolean;
}

const useFetchTags = (params: FetchTagsParams = {}) => {
  const axiosPublic = useAxiosPublic();

  const fetchTags = async (): Promise<Tag[]> => {
    const queryParams: Record<string, string | number> = {};

    if (params.search && params.search.trim() !== "") {
      queryParams.search = params.search.trim();
    }

    if (params.limit) {
      queryParams.limit = params.limit;
    }

    const res = await axiosPublic.get("/tags", {
      params: queryParams,
    });

    return res.data;
  };

  const queryKey = ["tags", params.search ?? "", params.limit ?? null] as const;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  }: UseQueryResult<Tag[], AxiosError> = useQuery({
    queryKey,
    queryFn: fetchTags,
    enabled: params.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    tags: data ?? [],
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    refetch,
  };
};

export default useFetchTags;
