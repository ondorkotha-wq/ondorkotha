/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useMemo } from "react";
import useAxiosSecure from "../../Axios/useAxiosSecure";
import { toast } from "react-hot-toast";

interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
}

const useFetchSubCategoriesByCategoryIds = (categoryIds: number[]) => {
  const axiosSecure = useAxiosSecure();
  const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAllActive = async () => {
      setIsLoading(true);
      try {
        // Calling your existing logic: getAllActiveCategories(true)
        const res = await axiosSecure.get(`subcategories/with-relations`);
        setAllSubCategories(res.data);
      } catch (err) {
        toast.error("Failed to load subcategory database");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllActive();
  }, [axiosSecure]);

  const filteredCategories = useMemo(() => {
    if (!categoryIds || categoryIds.length === 0) return [];
    
    return allSubCategories.filter((cat) => 
      categoryIds.includes(cat.categoryId)
    );
  }, [allSubCategories, categoryIds]);

  return { subCategoryList: filteredCategories, isLoading };
};

export default useFetchSubCategoriesByCategoryIds;