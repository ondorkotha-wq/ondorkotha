import { useEffect, useState } from "react";
import useAxiosSecure from "../../Axios/useAxiosSecure";
import { toast } from "react-hot-toast";

interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
}

const useFetchSubCategoriesByCategory = (categoryId: number | null) => {
  const axiosSecure = useAxiosSecure();
  const [subCategoryList, setSubCategoryList] = useState<SubCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!categoryId) {
        setSubCategoryList([]);
        setIsLoading(false);
        return;
      }
      try {
        const res = await axiosSecure.get(`/category/${categoryId}/subcategories`);
        setSubCategoryList(res.data);
      } catch {
        toast.error("Failed to load subcategories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubCategories();
  }, [axiosSecure, categoryId]);

  return { subCategoryList, isLoading };
};

export default useFetchSubCategoriesByCategory;
