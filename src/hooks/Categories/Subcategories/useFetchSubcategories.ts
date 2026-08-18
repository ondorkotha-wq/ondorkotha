import { useCallback, useEffect, useState } from "react";
import useAxiosPublic from "../../Axios/useAxiosPublic";
import { Category } from "@/types/menu";
import toast from "react-hot-toast";

const useFetchSubcategories = ({
  isActive = true,
}: {
  isActive?: boolean | null;
}) => {
  const axiosPublic = useAxiosPublic();
  const [subcategoryList, setSubCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubcategories = useCallback(async () => {
    try {
      const res = await axiosPublic.get(
        `/subcategories?isActive=${isActive}`,
      );
      setSubCategories(res.data);
    } catch {
      toast.error("Failed to load subcategories");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPublic, isActive]);

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  return { subcategoryList, isLoading, refetch: fetchSubcategories };
};

export default useFetchSubcategories;
