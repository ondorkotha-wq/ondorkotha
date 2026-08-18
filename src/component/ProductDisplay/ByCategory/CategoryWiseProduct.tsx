/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import priceData from "@/data/PriceData";
import sortData from "@/data/SortData";
import useFetchColors from "@/hooks/Attributes/useFetchColors";
import useFetchMaterials from "@/hooks/Attributes/useFetchMaterials";
import useFetchSubcategoryWiseProducts from "@/hooks/Products/useFetchSubcategoryWiseProducts";
import { Product, ProductImage } from "@/types/product.types";
import {
  ChevronDown,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import DisplayHeading from "../Heading/DisplayHeading";
import EachProductShow from "../EachProductShow";
import { QuickShopModal } from "../QuickShopModal";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import LoadingDots from "@/component/Loading/LoadingDS";

const PRODUCTS_PER_PAGE = 18;

function FilterDropdown({
  type,
  data,
  onClose,
}: {
  type: string;
  data: any[];
  onClose: () => void;
}) {
  return (
    <div
      className="absolute top-full left-0 mt-2 w-64 bg-white shadow-xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
      onMouseLeave={onClose}
    >
      <div className="max-h-80 overflow-y-auto p-4 custom-scrollbar">
        {data?.map((item: any) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-2 px-1 hover:bg-gray-50 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              {/* Conditional rendering for Color circles */}
              {type === "Color" && (
                <div
                  className="w-4 h-4 rounded-full border border-black"
                  style={{ backgroundColor: item.hexCode }}
                />
              )}
              <span className="text-sm text-gray-700 group-hover:text-black">
                {item.name}
              </span>
            </div>
            {/* Mock count as seen in your screenshot */}
            <span className="text-xs text-gray-400">(24)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CategoryWiseProduct() {
  const { slug } = useParams<{ slug: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState(
    sortData.sortCategories[0].name,
  );
  const [activeFilterTab, setActiveFilterTab] = useState<string | null>(null);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (filter: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredFilter(filter);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredFilter(null);
    }, 150);
  };

  const { products, meta, isLoading, isFetching, subCategory } =
    useFetchSubcategoryWiseProducts(slug, {
      page: currentPage,
      limit: PRODUCTS_PER_PAGE,
    });

  console.log(products, "products");

  const { colors: colorsData, isLoading: isColorLoading } = useFetchColors({});
  const { materials, isLoading: isMaterialLoading } = useFetchMaterials({});

  // console.log(products, "sortedImages");

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
    // Example: refetch products
    // fetchProducts({
    //   page: currentPage,
    //   sort: sortValue,
    // });
  };

  const [productImage, setProductImage] = useState("");
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  const handleImageChange = (images: ProductImage[]) => {
    // console.log(images, "imageeeeeees");
    const sortedImages = images.sort((a, b) => a.serialNo - b.serialNo);

    let secondImage = sortedImages[0].image;
    if (images.length > 1) secondImage = sortedImages[1].image;

    setProductImage(secondImage);
    setHoveredProduct(sortedImages[0].productId);
  };

  if (isLoading || isFetching) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  return (
    <div className="max-w-360 mx-auto px-4 md:px-8 py-6 font-sans text-[#222222]">
      <nav className="text-xs mb-8 flex items-center gap-2 text-gray-500">
        <span className="hover:underline cursor-pointer capitalize">
          {subCategory?.category && (
            <Link href={`/category/${subCategory?.category?.slug}`}>
              {subCategory?.category?.name}
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
        setCurrentPage={setCurrentPage}
        handleNextPage={handleNextPage}
        handlePrevPage={handlePrevPage}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      {/* Filter Bar */}
      <div className="mb-10">
        {/* Desktop Filters with Hover functionality */}
        <div className="hidden md:flex items-center gap-8 border-t border-gray-100 pt-4">
          {[
            { name: "Price", data: priceData.priceRanges },
            // { name: "Rooms", data: [] },
            // { name: "In Stock", data: [] },
            // { name: "Color", data: colorsData },
            { name: "Material", data: materials },
          ]?.map((filter) => (
            <div
              key={filter.name}
              className="relative"
              onMouseEnter={() => handleMouseEnter(filter.name)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  hoveredFilter === filter.name
                    ? "text-gray-400"
                    : "hover:opacity-60"
                }`}
              >
                {filter.name}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    hoveredFilter === filter.name ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Show dropdown on hover */}
              {hoveredFilter === filter.name && filter.data.length > 0 && (
                <FilterDropdown
                  type={filter.name}
                  data={filter.data || []}
                  onClose={() => setHoveredFilter(null)}
                />
              )}
            </div>
          ))}

          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 text-sm font-medium border-l pl-8"
          >
            All Filters <SlidersHorizontal size={14} />
          </button>
        </div>

        {/* Mobile Filter Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="w-full py-4 border border-gray-200 flex items-center justify-center gap-3 text-sm tracking-wide"
          >
            <SlidersHorizontal size={16} />
            Filter & Sort
          </button>
        </div>
      </div>

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

      {/* Pagination - Mobile */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`p-2 ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-black"
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`p-2 ${
              currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-black"
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Loading overlay during fetching */}
      {isFetching && !isLoading && (
        <div className="fixed inset-0 bg-white/50 z-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )}

      {isFilterOpen && (
        <div className="fixed inset-0 z-50">
          <div
            onClick={() => {
              setIsFilterOpen(false);
              setActiveFilterTab(null);
            }}
            className="absolute inset-0 bg-black/40"
          />

          <div className="absolute right-0 top-0 w-full sm:w-[420px] animate-filter-slide bg-[#FAF9F7] h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b text-center relative">
              {activeFilterTab && (
                <button
                  onClick={() => setActiveFilterTab(null)}
                  className="absolute left-4 top-5 text-gray-500 flex items-center gap-1 text-[10px] uppercase tracking-widest"
                >
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              <p className="text-xs tracking-widest uppercase text-gray-500">
                {activeFilterTab ? activeFilterTab : "Filter & Sort"}
              </p>
              <button
                onClick={() => {
                  setIsFilterOpen(false);
                  setActiveFilterTab(null);
                }}
                className="absolute right-4 top-5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!activeFilterTab ? (
                <>
                  {/* Sort Section (Pills) */}
                  <div className="px-6 py-6 border-b">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4 font-bold">
                      Sort By
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sortData.sortCategories?.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedSort(s.name);
                            // setIsSortOpen(false);
                            handleSortChange(s.name);
                          }}
                          className={`px-4 py-2 border text-[11px] transition-colors ${
                            selectedSort === s.name
                              ? "bg-black text-white border-black"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Category List */}
                  <div className="divide-y divide-gray-100">
                    {[
                      "Product Type",
                      "Rooms",
                      "In Stock",
                      "Color",
                      "Price",
                      "Material",
                    ]?.map((item) => (
                      <button
                        key={item}
                        onClick={() => setActiveFilterTab(item)}
                        className="w-full px-6 py-5 flex items-center justify-between text-sm font-medium hover:bg-white transition-colors"
                      >
                        {item}
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* COLOR VIEW */}
                  {activeFilterTab === "Color" && (
                    <div className="grid grid-cols-2 gap-4">
                      {colorsData?.map((color: any) => (
                        <label
                          key={color.id}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 border-gray-300 rounded accent-black"
                          />
                          <div
                            className="w-5 h-5 rounded-full border border-gray-200"
                            style={{ backgroundColor: color.hexCode }}
                          />
                          <span className="text-xs text-gray-700 group-hover:text-black">
                            {color.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* MATERIAL VIEW */}
                  {activeFilterTab === "Material" && (
                    <div className="grid grid-cols-2 gap-4">
                      {materials?.map((material: any) => (
                        <label
                          key={material.id}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 border-gray-300 rounded accent-black"
                          />
                          {/* <div
                            className="w-5 h-5 rounded-full border border-gray-200"
                            style={{ backgroundColor: material.hexCode }}
                          /> */}
                          <span className="text-xs text-gray-700 group-hover:text-black">
                            {material.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* PRICE VIEW */}
                  {activeFilterTab === "Price" && (
                    <div className="space-y-4">
                      {priceData.priceRanges?.map((price) => (
                        <label
                          key={price.id}
                          className="flex items-center gap-3 cursor-pointer py-1"
                        >
                          <input
                            type="radio"
                            name="price"
                            className="w-4 h-4 accent-black"
                          />
                          <span className="text-sm text-gray-700">
                            {price.name}
                          </span>
                        </label>
                      ))}
                      <div className="pt-6">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4 font-bold">
                          Custom Range
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            className="w-full border p-2 text-xs"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="number"
                            placeholder="Max"
                            className="w-full border p-2 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Default for other tabs */}
                  {activeFilterTab !== "Color" &&
                    activeFilterTab !== "Price" && (
                      <p className="text-sm text-gray-400 italic">
                        No options available for {activeFilterTab} yet.
                      </p>
                    )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t flex gap-3 mt-auto">
              <button className="flex-1 py-4 border border-gray-200 text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-black hover:border-black transition">
                Clear All
              </button>
              <button className="flex-1 py-4 bg-[#4E5B6D] text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-[#3d4857] transition">
                View Results ({totalProducts})
              </button>
            </div>
          </div>
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
