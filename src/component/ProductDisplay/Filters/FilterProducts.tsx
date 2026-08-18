/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import priceData from "@/data/PriceData";
import sortData from "@/data/SortData";
import useFetchSeriesWiseSubcategories from "@/hooks/Categories/Subcategories/useFetchSeriesWiseSubcategories";
import { SubCategory } from "@/types/menu";
import { Color } from "@/types/product.types";
import { Material } from "@/hooks/Attributes/useFetchMaterials";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import React, { Dispatch, SetStateAction, useState } from "react";

type FilterDropdownProps = {
  type: string;
  data: any[];
  selectedIds?: number[];
  onToggleSelect?: (id: number) => void;
  onPriceSelect?: (min: number, max: number) => void;
  onClose: () => void;
};

const FilterDropdown = ({
  type,
  data,
  selectedIds = [],
  onToggleSelect,
  onPriceSelect,
  onClose,
}: any) => {
  return (
    <div className="absolute top-full left-0 mt-2 w-64 bg-white border shadow-xl z-40">
      {/* PRICE */}
      {type === "Price" && (
        <div className="p-3 space-y-2">
          {data.map((price: any) => (
            <button
              key={price.id}
              onClick={() => onPriceSelect?.(price.min, price.max)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            >
              {price.name}
            </button>
          ))}
        </div>
      )}

      {/* COLOR / MATERIAL */}
      {type !== "Price" && (
        <div className="p-3 space-y-2">
          {data.map((item: any) => {
            const active = selectedIds.includes(item.id);

            return (
              <button
                key={item.id}
                onClick={() => onToggleSelect?.(item.id)}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded transition ${
                  active ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                {type === "Color" ? (
                  item.image ? (
                    <div className="w-5 h-5 rounded-full border border-gray-300 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full border border-gray-300"
                      style={{ backgroundColor: item.hexCode }}
                    />
                  )
                ) : type === "Material" && item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-5 h-5 rounded border border-gray-300 object-cover"
                  />
                ) : null}
                {item.name}
                {active && "✓"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

type FilterProps = {
  slug?: string;
  colors: Color[];
  materials: Material[];
  setCurrentPage: Dispatch<SetStateAction<number>>;
  filters: {
    colorIds?: number[];
    materialIds?: number[];
    subCategoryIds?: number[];
    minPrice?: number;
    maxPrice?: number;
  };
  setFilters: Dispatch<
    SetStateAction<{
      colorIds?: number[];
      materialIds?: number[];
      subCategoryIds?: number[];
      minPrice?: number;
      maxPrice?: number;
    }>
  >;
  subcategories?: SubCategory[];
  handleSortChange: (sortValue: string) => void;
  selectedSort: string;
  totalProducts: number;
};

const FILTERS = ["Color", "Price", "Material"];

const FilterProducts = ({
  slug,
  colors: colorsData,
  materials: materialData,
  setCurrentPage,
  filters,
  setFilters,
  subcategories,
  handleSortChange,
  selectedSort,
  totalProducts,
}: FilterProps) => {
  const { subCategoryList: seriesWiseSubcategories } =
    useFetchSeriesWiseSubcategories({
      seriesSlug: slug,
    });

  if (subcategories && !FILTERS.includes("Product Type")) {
    FILTERS.push("Product Type");
  }

  const visibleMobileFilters = FILTERS.filter((item) => {
    if (item === "Color" && colorsData) return colorsData.length > 0;
    if (item === "Material" && materialData) return materialData.length > 0;
    return true;
  });

  const [activeDesktopFilter, setActiveDesktopFilter] = useState<string | null>(
    null,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-10">
        {/* Desktop Filters with Hover functionality */}
        <div className="hidden md:flex items-center gap-8 border-t border-gray-100 pt-4">
          {[
            { name: "Price", data: priceData.priceRanges },
            { name: "Color", data: colorsData },
            { name: "Material", data: materialData },
          ].filter((f) => f.name === "Price" || (f.data && f.data.length > 0)).map((filter) => (
            <div key={filter.name} className="relative">
              <button
                onClick={() =>
                  setActiveDesktopFilter(
                    activeDesktopFilter === filter.name ? null : filter.name,
                  )
                }
                className="flex items-center gap-2 text-sm font-medium hover:opacity-60"
              >
                {filter.name}
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    activeDesktopFilter === filter.name ? "rotate-180" : ""
                  }`}
                />
              </button>

              {activeDesktopFilter === filter.name && (
                <FilterDropdown
                  type={filter.name as any}
                  data={filter.data}
                  selectedIds={
                    filter.name === "Color"
                      ? (filters.colorIds ?? [])
                      : filter.name === "Material"
                        ? (filters.materialIds ?? [])
                        : []
                  }
                  onToggleSelect={(id: number) => {
                    setCurrentPage(1);

                    setFilters((prev) => {
                      if (filter.name === "Color") {
                        const s = new Set(prev.colorIds ?? []);
                        s.has(id) ? s.delete(id) : s.add(id);
                        return { ...prev, colorIds: [...s] };
                      }

                      if (filter.name === "Material") {
                        const s = new Set(prev.materialIds ?? []);
                        s.has(id) ? s.delete(id) : s.add(id);
                        return { ...prev, materialIds: [...s] };
                      }

                      return prev;
                    });
                  }}
                  onPriceSelect={(min: number, max: number) => {
                    setCurrentPage(1);
                    setFilters((prev) => ({
                      ...prev,
                      minPrice: min,
                      maxPrice: max,
                    }));
                    setActiveDesktopFilter(null);
                  }}
                  onClose={() => setActiveDesktopFilter(null)}
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

      {/* Applied Filters Bar */}
      {(filters.colorIds?.length ||
        filters.materialIds?.length ||
        filters.subCategoryIds?.length ||
        filters.minPrice ||
        filters.maxPrice) && (
        <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
          {/* Color chips */}
          {filters.colorIds?.map((id) => {
            const color = colorsData?.find((c: any) => c.id === id);
            if (!color) return null;

            return (
              <button
                key={`color-${id}`}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    colorIds: prev.colorIds?.filter((c) => c !== id),
                  }))
                }
                className="flex items-center gap-2 px-3 py-1 border rounded-full bg-white hover:bg-gray-50"
              >
                {color.image ? (
                  <div className="w-5 h-5 rounded-full border border-gray-300 overflow-hidden">
                    <img
                      src={color.image}
                      alt={color.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-5 h-5 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.hexCode }}
                  />
                )}
                {color.name}
                <X size={14} />
              </button>
            );
          })}

          {/* Material chips */}
          {filters.materialIds?.map((id) => {
            const material = materialData?.find((m: any) => m.id === id);
            if (!material) return null;

            return (
              <button
                key={`material-${id}`}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    materialIds: prev.materialIds?.filter((m) => m !== id),
                  }))
                }
                className="flex items-center gap-2 px-3 py-1 border rounded-full bg-white hover:bg-gray-50"
              >
                {material.name}
                <X size={14} />
              </button>
            );
          })}

          {/* subcategories */}
          {filters.subCategoryIds?.map((id) => {
            const subcat = subcategories?.find((m: any) => m.id === id);
            if (!subcat) return null;

            return (
              <button
                key={`subcat-${id}`}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    subCategoryIds: prev.subCategoryIds?.filter(
                      (m) => m !== id,
                    ),
                  }))
                }
                className="flex items-center gap-2 px-3 py-1 border rounded-full bg-white hover:bg-gray-50"
              >
                {subcat.name}
                <X size={14} />
              </button>
            );
          })}

          {/* Price chip */}
          {(filters.minPrice || filters.maxPrice) && (
            <button
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  minPrice: undefined,
                  maxPrice: undefined,
                }))
              }
              className="flex items-center gap-2 px-3 py-1 border rounded-full bg-white hover:bg-gray-50"
            >
              ৳{filters.minPrice ?? 0} – ৳{filters.maxPrice ?? "∞"}
              <X size={14} />
            </button>
          )}

          {/* Clear all */}
          <button
            onClick={() => {
              setFilters({});
              setCurrentPage(1);
            }}
            className="ml-2 text-xs underline text-gray-500 hover:text-black"
          >
            Clear All
          </button>
        </div>
      )}

      {/* filters sidebar  */}
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
            <div className="px-6 py-5 border-b border-gray-200 text-center relative">
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
                  <div className="px-6 py-6 border-b border-gray-200">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4 font-bold">
                      Sort By
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sortData.sortCategories?.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            // setSelectedSort(s.name);
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
                    {visibleMobileFilters.map((item) => (
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
                            checked={
                              filters.colorIds?.includes(color.id) ?? false
                            }
                            onChange={(e) => {
                              setFilters((prev) => {
                                const ids = new Set(prev.colorIds ?? []);
                                e.target.checked
                                  ? ids.add(color.id)
                                  : ids.delete(color.id);
                                return { ...prev, colorIds: Array.from(ids) };
                              });
                            }}
                            className="w-4 h-4 accent-black"
                          />

                          {color.image ? (
                            <div className="w-5 h-5 rounded-full border border-gray-300 overflow-hidden">
                              <img
                                src={color.image}
                                alt={color.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className="w-5 h-5 rounded-full border border-gray-300"
                              style={{ backgroundColor: color.hexCode }}
                            />
                          )}
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
                      {materialData?.map((material: any) => (
                        <label
                          key={material.id}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={
                              filters.materialIds?.includes(material.id) ??
                              false
                            }
                            onChange={(e) => {
                              setFilters((prev) => {
                                const ids = new Set(prev.materialIds ?? []);
                                e.target.checked
                                  ? ids.add(material.id)
                                  : ids.delete(material.id);
                                return {
                                  ...prev,
                                  materialIds: Array.from(ids),
                                };
                              });
                              // setCurrentPage(1);
                            }}
                            className="w-4 h-4 accent-black"
                          />

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
                      {/* price data select radio */}
                      {priceData.priceRanges?.map((price) => (
                        <label
                          key={price.id}
                          className="flex items-center gap-3 cursor-pointer py-1"
                        >
                          <input
                            type="radio"
                            name="price"
                            onChange={() => {
                              setFilters((prev) => ({
                                ...prev,
                                minPrice: price.min,
                                maxPrice: price.max,
                              }));
                              // setCurrentPage(1);
                            }}
                            className="w-4 h-4 accent-black"
                          />

                          <span className="text-sm text-gray-700">
                            {price.name}
                          </span>
                        </label>
                      ))}
                      {/* custom range  */}
                      <div className="pt-6">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4 font-bold">
                          Custom Range
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                minPrice: Number(e.target.value),
                              }))
                            }
                          />

                          <input
                            type="number"
                            placeholder="Max"
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                maxPrice: Number(e.target.value),
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeFilterTab === "Product Type" && (
                    <div className="grid grid-cols-2 gap-4">
                      {seriesWiseSubcategories?.map((subCat: any) => (
                        <label
                          key={subCat.id}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={
                              filters.subCategoryIds?.includes(subCat.id) ??
                              false
                            }
                            onChange={(e) => {
                              setFilters((prev) => {
                                const ids = new Set(prev.subCategoryIds ?? []);
                                e.target.checked
                                  ? ids.add(subCat.id)
                                  : ids.delete(subCat.id);
                                return {
                                  ...prev,
                                  subCategoryIds: Array.from(ids),
                                };
                              });
                              // setCurrentPage(1);
                            }}
                            className="w-4 h-4 accent-black"
                          />

                          <span className="text-xs text-gray-700 group-hover:text-black">
                            {subCat.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Default for other tabs */}
                  {/* {activeFilterTab !== "Color" &&
                    activeFilterTab !== "Price" && (
                      <p className="text-sm text-gray-400 italic">
                        No options available for {activeFilterTab} yet.
                      </p>
                    )} */}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t flex gap-3 mt-auto">
              <button
                onClick={() => {
                  setFilters({});
                  // setCurrentPage(1);
                }}
                className="flex-1 py-4 border border-gray-200 text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-black hover:border-black transition"
              >
                Clear All
              </button>
              <button
                onClick={() => {
                  setIsFilterOpen(false);
                  setActiveFilterTab(null);
                  // setCurrentPage(1);
                }}
                className="flex-1 py-4 bg-[#4E5B6D] text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-[#3d4857] transition"
              >
                View Results ({totalProducts})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterProducts;
