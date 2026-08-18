import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";

export interface HomepageGalleryItem {
  id: number;
  name: string;
  image: string;
  slug: string;
  isHeading: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const useFetchHomepageGallery = (onlyActive = false) => {
  const axiosSecure = useAxiosSecure();

  const { data, isLoading, refetch } = useQuery<HomepageGalleryItem[]>({
    queryKey: ["homepage-gallery", onlyActive],
    queryFn: async () => {
      const res = await axiosSecure.get("/homepage-gallery", {
        params: onlyActive ? { onlyActive: "true" } : {},
      });
      return res.data;
    },
  });

  return { items: data ?? [], isLoading, refetch };
};

export default useFetchHomepageGallery;