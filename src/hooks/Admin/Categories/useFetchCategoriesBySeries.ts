import { useEffect, useState } from "react";
import useAxiosSecure from "../../Axios/useAxiosSecure";
import { toast } from "react-hot-toast";

interface Category {
  id: number;
  name: string;
}

const useFetchCategoriesBySeries = (seriesId: number | null) => {
  const axiosSecure = useAxiosSecure();
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!seriesId) {
        setCategoryList([]);
        setIsLoading(false);
        return;
      }
      try {
        const res = await axiosSecure.get(`/series/${seriesId}/categories`);
        setCategoryList(res.data);
      } catch {
        toast.error("Failed to load categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [axiosSecure, seriesId]);

  return { categoryList, isLoading };
};

export default useFetchCategoriesBySeries;
