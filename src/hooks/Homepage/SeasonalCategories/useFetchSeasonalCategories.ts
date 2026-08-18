/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";

export interface SeasonalCategory {
  id: number;
  title: string;
  image: string;
  link: string;
  sortOrder: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

type ActiveFilter = boolean | null | undefined;

const useFetchSeasonalCategories = (isActive?: ActiveFilter) => {
  const axiosSecure = useAxiosSecure();

  const { data, isLoading, refetch } = useQuery<SeasonalCategory[]>({
    queryKey: ["seasonal-categories", isActive],
    queryFn: async () => {
      const params: Record<string, any> = {};

      if (typeof isActive === "boolean") {
        params.isActive = isActive;
      }

      const res = await axiosSecure.get("/seasonal-categories", { params });
      return res.data;
    },
  });

  return { categories: data ?? [], isLoading, refetch };
};

export default useFetchSeasonalCategories;
