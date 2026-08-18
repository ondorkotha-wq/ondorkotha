import { useEffect, useState, useMemo } from "react";
import useAxiosSecure from "../../Axios/useAxiosSecure";
import { toast } from "react-hot-toast";

interface Category {
  id: number;
  name: string;
  seriesId: number;
  // series object will be here if withRelations is true
}

const useFetchCategoriesBySeriesIds = (seriesIds: number[]) => {
  const axiosSecure = useAxiosSecure();
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAllActive = async () => {
      setIsLoading(true);
      try {
        // Calling your existing logic: getAllActiveCategories(true)
        const res = await axiosSecure.get(`categories/with-relations`);
        setAllCategories(res.data);
      } catch (err) {
        toast.error("Failed to load category database");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllActive();
  }, [axiosSecure]);

  // Use useMemo to filter the list whenever seriesIds change
  // without re-fetching from the server
  const filteredCategories = useMemo(() => {
    if (!seriesIds || seriesIds.length === 0) return [];

    return allCategories.filter((cat) => seriesIds.includes(cat.seriesId));
  }, [allCategories, seriesIds]);

  return { categoryList: filteredCategories, isLoading };
};

export default useFetchCategoriesBySeriesIds;
