import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import useAxiosPublic from "../../Axios/useAxiosPublic";
import { Series } from "@/types/menu";

const useFetchSeries = ({ isActive = true }: { isActive?: boolean | null }) => {
  const axiosPublic = useAxiosPublic();
  const [seriesList, setSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSeries = useCallback(async () => {
    try {
      const res = await axiosPublic.get(`/series?isActive=${isActive}`);
      const data: Series[] = res.data;

      // Pin NEW first, SALE last — backend guarantees this but enforce client-side too
      const newItems = data.filter((s) => s.seriesType === "NEW");
      const saleItems = data.filter((s) => s.seriesType === "SALE");
      const normal = data.filter(
        (s) => s.seriesType !== "NEW" && s.seriesType !== "SALE",
      );
      setSeries([...newItems, ...normal, ...saleItems]);
    } catch {
      toast.error("Failed to load series");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPublic, isActive]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  return { seriesList, isLoading, refetch: fetchSeries };
};

export default useFetchSeries;
