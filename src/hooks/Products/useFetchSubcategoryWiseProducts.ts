/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { FetchProductsParams, Product } from "@/types/product.types";
import useAxiosPublic from "../Axios/useAxiosPublic";
import { BlogPost } from "@/types/blog";
import { SubCategory } from "@/types/menu";

export interface ProductsResponse {
  products: Product[];
  blog: BlogPost | null;
  subCategory: SubCategory;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Synthetic subCategory returned when viewing "All Sales" page
const SALE_ALL_SUBCATEGORY: SubCategory = {
  id: 0,
  name: "All Sale Items",
  slug: "sale-all",
  image: null,
  sortOrder: 1,
  isActive: true,
  categoryId: 0,
  createdAt: "",
  updatedAt: "",
  category: {
    id: 0,
    slug: "sale",
    name: "Sale",
    image: null,
    sortOrder: 9999,
    isActive: true,
    seriesId: 0,
    createdAt: "",
    updatedAt: "",
    series: {
      id: 0,
      name: "Sale",
      slug: "sale",
      image: null,
      notice: null,
      sortOrder: 9999,
      seriesType: "SALE",
    },
    subCategories: [],
  },
};

const useFetchSubcategoryWiseProducts = (
  subCategorySlug: string,
  params?: FetchProductsParams,
) => {
  const axiosPublic = useAxiosPublic();
  const isSaleAll = subCategorySlug === "sale-all";

  const fetchProducts = async (): Promise<ProductsResponse> => {
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

    // "All Sales" page — calls the dedicated on-sale endpoint
    if (isSaleAll) {
      const { data } = await axiosPublic.get<{
        data: Product[];
        meta: ProductsResponse["meta"];
      }>("/product/on-sale", { params: cleanParams });

      return {
        products: data.data,
        blog: null,
        subCategory: SALE_ALL_SUBCATEGORY,
        meta: data.meta,
      };
    }

    const { data } = await axiosPublic.get<ProductsResponse>(
      `/subcategory/${subCategorySlug}/products`,
      { params: cleanParams },
    );

    console.log(data, "subCategorySlug products");

    return data;
  };

  const queryKey = [
    "subCatWiseProducts",
    subCategorySlug,
     params?.page,
    params?.limit,
    params?.search,
    params?.isActive,
    params?.colorIds?.join(","),
    params?.materialIds?.join(","),
    params?.minPrice,
    params?.maxPrice,
    params?.sortBy,
    params?.order,
  ];

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<ProductsResponse>({
    queryKey,
    queryFn: fetchProducts,
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    enabled: !!subCategorySlug, // important safety
  });

  return {
    products: response?.products ?? [],
    blog: response?.blog ?? null,
    subCategory: response?.subCategory ?? null,
    meta: response?.meta ?? {
      total: 0,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: 0,
    },
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
};

export default useFetchSubcategoryWiseProducts;
