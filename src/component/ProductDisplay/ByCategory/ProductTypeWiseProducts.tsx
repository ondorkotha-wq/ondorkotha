/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import sortData from "@/data/SortData";
import useFetchSubcategoryWiseProducts from "@/hooks/Products/useFetchSubcategoryWiseProducts";
import useFetchCategoryFilters from "@/hooks/Attributes/useFetchCategoryFilters";
import { Product, ProductImage } from "@/types/product.types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DisplayHeading from "../Heading/DisplayHeading";
import BottomPagination from "../../Pagination/BottomPagination";
import EachProductShow from "../EachProductShow";
import { QuickShopModal } from "../QuickShopModal";
import FilterProducts from "../Filters/FilterProducts";
import { devLog } from "@/utils/devlog";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import LoadingDots from "@/component/Loading/LoadingDS";

const PRODUCTS_PER_PAGE = 18;

export default function ProductTypeWiseProducts() {
  const { slug } = useParams<{ slug: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [selectedSort, setSelectedSort] = useState(
    sortData.sortCategories[0].name,
  );

  const [filters, setFilters] = useState<{
    colorIds?: number[];
    materialIds?: number[];
    subCategoryIds?: number[];
    minPrice?: number;
    maxPrice?: number;
  }>({});

  const [productImage, setProductImage] = useState("");
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  const [sortParams, setSortParams] = useState<{
    sortBy?: string;
    order?: "asc" | "desc";
  }>({});

  const { colors, materials } = useFetchCategoryFilters({ slug, type: "subcategory" });

  const { products, meta, isLoading, isFetching, blog, subCategory, refetch } =
    useFetchSubcategoryWiseProducts(slug, {
      page: currentPage,
      limit: PRODUCTS_PER_PAGE,

      colorIds: filters.colorIds,
      materialIds: filters.materialIds,
      subCategoryIds: filters.subCategoryIds,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sortBy: sortParams.sortBy,
      order: sortParams.order,
    });

  // set current page to 1
  useEffect(() => {
    setCurrentPage(1);
    devLog(filters, "filters");
    // refetch();
  }, [
    filters.colorIds,
    filters.materialIds,
    filters.subCategoryIds,
    filters.minPrice,
    filters.maxPrice,
    filters,
  ]);

  // title setup
  useEffect(() => {
    if (isLoading) {
      document.title = `Ondorkotha - Product Type`;
    } else if (subCategory) {
      document.title = `Ondorkotha - ${subCategory?.name}`;
    }
  }, [isLoading, subCategory]);

  // console.log(products, "products");

  const totalPages = meta?.totalPages || 1;
  const totalProducts = meta?.total || 0;

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSortChange = (sortValue: string) => {
    setSelectedSort(sortValue);
    setCurrentPage(1);

    switch (sortValue) {
      // case "Relevance":
      //   setSortParams({ sortBy: "createdAt", order: "asc" });
      //   break;
      case "Price: Low to High":
        setSortParams({ sortBy: "price", order: "asc" });
        break;
      case "Price: High to Low":
        setSortParams({ sortBy: "price", order: "desc" });
        break;
      case "Newest":
        setSortParams({ sortBy: "createdAt", order: "desc" });
        break;
      case "Featured":
        setSortParams({ sortBy: "featured", order: "desc" });
        break;
      case "Bestselling":
        setSortParams({ sortBy: "soldCount", order: "desc" });
        break;
      case "Ratings":
        setSortParams({ sortBy: "rating", order: "desc" });
        break;
      case "A–Z":
        setSortParams({ sortBy: "title", order: "asc" });
        break;
      case "Z–A":
        setSortParams({ sortBy: "title", order: "desc" });
        break;
      default:
        setSortParams({});
    }
  };

  if (isLoading || isFetching) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 font-sans text-[#222222]">
      <nav className="text-xs mb-8 flex items-center gap-2 text-gray-500">
        <span className="hover:underline cursor-pointer capitalize">
          {subCategory?.category?.series && (
            <Link href={`/series/${subCategory?.category?.series?.slug}`}>
              {subCategory?.category?.series?.name}
            </Link>
          )}
        </span>
        <span>/</span>
        <span className="text-black font-medium capitalize">
          {subCategory?.name || slug?.replace(/-/g, " ")}
        </span>
      </nav>

      {/* Header Section */}
      <DisplayHeading
        name={subCategory?.name || slug?.replace(/-/g, " ")}
        isLoading={isLoading}
        totalProducts={totalProducts}
        isSortOpen={isSortOpen}
        setIsSortOpen={setIsSortOpen}
        selectedSort={selectedSort}
        handleSortChange={handleSortChange}
        setSelectedSort={setSelectedSort}
        sortData={sortData}
        handleNextPage={handleNextPage}
        handlePrevPage={handlePrevPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      {/* Filter Bar */}
      <FilterProducts
        setFilters={setFilters}
        setCurrentPage={setCurrentPage}
        filters={filters}
        colors={colors}
        materials={materials}
        handleSortChange={handleSortChange}
        selectedSort={selectedSort}
        totalProducts={totalProducts}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* Product Cards from API */}
      {!isLoading && products && products.length > 0 ? (
        <EachProductShow
          products={products}
          setSelectedProduct={setSelectedProduct}
          productImage={productImage}
          hoveredProduct={hoveredProduct}
          setProductImage={setProductImage}
          setHoveredProduct={setHoveredProduct}
        />
      ) : (
        <div className="col-span-2 md:col-span-3 text-center py-20 text-gray-500">
          No products found
        </div>
      )}

      {/* Pagination bottom */}
      {!isLoading && totalPages > 1 && (
        <BottomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          handlePrevPage={handlePrevPage}
          handleNextPage={handleNextPage}
        />
      )}

      {/* Loading overlay during fetching */}
      {isFetching && !isLoading && (
        <div className="fixed inset-0 bg-white/50 z-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* Quick Shop Modal */}
      {selectedProduct && (
        <QuickShopModal
          slug={selectedProduct.slug}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
