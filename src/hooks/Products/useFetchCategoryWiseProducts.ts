/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { FetchProductsParams, Product } from "@/types/product.types";
import useAxiosPublic from "../Axios/useAxiosPublic";

export interface ProductsResponse {
  products: Product[];
  blog: {
    id: number;
    title: string;
    slug: string;
    content: string;
  } | null;
  subCategory: {
    id: number;
    name: string;
    slug: string;
    category: {
      id: number;
      name: string;
      slug: string;
    } | null;
    categoryId: number;
  } | null;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const useFetchCategoryWiseProducts = (
  subCategorySlug: string,
  params?: FetchProductsParams,
) => {
  const axiosPublic = useAxiosPublic();

  const fetchProducts = async (): Promise<ProductsResponse> => {
    const cleanParams: Record<string, any> = {};

    if (params?.page) cleanParams.page = params.page;
    if (params?.limit) cleanParams.limit = params.limit;
    if (params?.search) cleanParams.search = params.search;

    if (typeof params?.isActive === "boolean") {
      cleanParams.isActive = params.isActive;
    }

    const { data } = await axiosPublic.get<ProductsResponse>(
      `/subcategory/${subCategorySlug}/products`,
      { params: cleanParams },
    );

    // console.log(data, "subCategorySlug products ");

    return data;
  };

  const queryKey = [
    "subCatWiseProducts",
    subCategorySlug,
    params?.page,
    params?.limit,
    params?.search,
    params?.isActive,
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

export default useFetchCategoryWiseProducts;
