/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useFetchSeriesWiseProducts.ts
import { useQuery } from "@tanstack/react-query";
import { FetchProductsParams, Product } from "@/types/product.types";
import useAxiosPublic from "../Axios/useAxiosPublic";
import { SubCategory } from "@/types/menu";
import { BlogPost } from "@/types/blog";
import { devLog } from "@/utils/devlog";

// Update or add this type
interface SeriesProductResponse {
  products: Product[];
  subcategories: SubCategory[];
  blog: BlogPost | null;
  series: string;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const useFetchSeriesWiseProducts = (
  seriesSlug: string,
  params?: FetchProductsParams,
) => {
  // console.log(params,'params');
  const axiosPublic = useAxiosPublic();

  // hooks/useFetchSeriesWiseProducts.ts - Update the fetchProducts function
  const fetchProducts = async (): Promise<SeriesProductResponse> => {
    const cleanParams: Record<string, any> = {};

    if (params?.page) cleanParams.page = params.page;
    if (params?.limit) cleanParams.limit = params.limit;
    if (params?.search) cleanParams.search = params.search;

    // Fix: Use plural parameter names as expected by backend
    if (params?.colorIds?.length)
      cleanParams.colorIds = params.colorIds.join(",");
    if (params?.materialIds?.length)
      cleanParams.materialIds = params.materialIds.join(",");
    if (params?.subCategoryIds?.length)
      cleanParams.subCategoryIds = params.subCategoryIds.join(",");

    if (params?.minPrice !== undefined) cleanParams.minPrice = params.minPrice;

    if (params?.maxPrice !== undefined) cleanParams.maxPrice = params.maxPrice;

    if (params?.sortBy) cleanParams.sortBy = params.sortBy;
    if (params?.order) cleanParams.order = params.order;

    if (typeof params?.isActive === "boolean") {
      cleanParams.isActive = params.isActive;
    }

    devLog(cleanParams, "cleanParams");

    // Sale series — same endpoint as "All Sales" subcategory page
    if (seriesSlug === "sale") {
      const { data } = await axiosPublic.get<SeriesProductResponse>(
        "/product/on-sale",
        { params: cleanParams },
      );

      return data;
      // {
      //   products: data.products,
      //   subcategories: data.subcategories,
      //   blog: data.blog,
      //   series: "Sale",
      //   meta: data.meta,
      // };
    }

    const response = await axiosPublic.get<SeriesProductResponse>(
      `/series/${seriesSlug}/products`,
      { params: cleanParams },
    );

    devLog("series", response.data);

    return response.data;
  };

  const queryKey = [
    "seriesWiseProducts",
    seriesSlug,
    params?.page,
    params?.limit,
    params?.search,
    params?.isActive,
    params?.colorIds?.join(","),
    params?.materialIds?.join(","),
    params?.subCategoryIds?.join(","),
    params?.minPrice,
    params?.maxPrice,
    params?.sortBy,
    params?.order,
  ];

  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery<SeriesProductResponse>({
      queryKey,
      queryFn: fetchProducts,
      placeholderData: (previousData) => previousData,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      enabled: !!seriesSlug, // Only fetch if seriesSlug exists
    });

  return {
    products: data?.products ?? [],
    subcategories: data?.subcategories ?? [],
    blog: data?.blog ?? null,
    seriesName: data?.series,
    meta: data?.meta ?? {
      total: 0,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: 1,
    },
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
};

export default useFetchSeriesWiseProducts;
