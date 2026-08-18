import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import useAxiosPublic from "../Axios/useAxiosPublic";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

export interface Material {
  id: number;
  name: string;
  slug: string;
  hexCode: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

const useFetchMaterials = ({
  isActive = true,
  isEnabled = true,
}: {
  isActive?: boolean | null;
  isEnabled?: boolean;
}) => {
  const axiosPublic = useAxiosPublic();

  const {
    data: materials = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Material[]>({
    queryKey: ["materials", isActive],
    enabled: !!isEnabled, // wait until auth loading finishes
    queryFn: async () => {
      const response = await axiosPublic.get<Material[]>(
        `/materials?isActive=${isActive}`,
      );
      return response.data;
    },
  });

  return {
    materials,
    isLoading,
    error: axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error?.message,
    refetch,
  };
};

export default useFetchMaterials;
