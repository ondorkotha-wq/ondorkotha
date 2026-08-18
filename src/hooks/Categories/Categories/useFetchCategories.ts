import { useCallback, useEffect, useState } from "react";
import useAxiosPublic from "../../Axios/useAxiosPublic";
import { Category } from "@/types/menu";
import toast from "react-hot-toast";

const useFetchCategories = ({ isActive = true }: { isActive?: boolean | null }) => {
  const axiosPublic = useAxiosPublic();
  const [categoryList, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axiosPublic.get(`/categories?isActive=${isActive}`);
      setCategories(res.data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPublic, isActive]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categoryList, isLoading, refetch: fetchCategories };
};

export default useFetchCategories;
