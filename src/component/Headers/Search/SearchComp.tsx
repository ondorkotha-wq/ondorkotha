/* eslint-disable @next/next/no-img-element */
"use client";

import { Search, X, ArrowLeft, TrendingUp, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useFetchProducts from "@/hooks/Products/useFetchProducts";
import useFetchTags from "@/hooks/Tags/useFetchTags";
import { pushGTMEvent } from "@/lib/gtm";

type SearchCompProps = {
  placeholder?: string;
  debounceMs?: number;
};

const Section = ({
  title,
  icon,
  children,
  isGrid = false,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isGrid?: boolean;
}) => {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-gray-400">{icon}</span>}
        <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
          {title}
        </h4>
      </div>
      <div className={isGrid ? "grid grid-cols-3 gap-3" : "space-y-1"}>
        {children}
      </div>
    </div>
  );
};

const ProductItem = ({
  product,
  close,
}: {
  product: any;
  close: () => void;
}) => {
  const router = useRouter();

  const handleClick = () => {
    close();
    router.push(`/products/${product.slug}`);
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-col items-center text-center gap-2 p-2 cursor-pointer 
        hover:bg-gray-50 transition-all duration-200 group border border-transparent hover:border-gray-200"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100 shadow-sm">
        <img
          src={product.images?.[0]?.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
        />
        {product.discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{product.discount}%
          </div>
        )}
      </div>
      <p className="text-[11px] sm:text-xs font-medium text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
        {product.title}
      </p>
      {product.price && (
        <p className="text-[10px] sm:text-xs font-semibold text-gray-900">
          ৳{product.price.toLocaleString()}
        </p>
      )}
    </div>
  );
};

const LoadingSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex flex-col gap-2 p-2 animate-pulse">
        <div className="aspect-square w-full bg-gray-200 "></div>
        <div className="h-3 bg-gray-200 w-3/4 mx-auto"></div>
      </div>
    ))}
  </>
);

const SearchComp = ({
  placeholder = "Search products, categories...",
  debounceMs = 300,
}: SearchCompProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  /* ------------------ FETCHES ------------------ */
  const { products: trendingProducts, isLoading: isTrendingLoading } =
    useFetchProducts({
      limit: 3,
      sortBy: "trendScore",
      order: "desc",
      thumb: true,
      enabled: isOpen && !debouncedQuery,
    });

  const { products: newArrivals, isLoading: isNewArrivalLoading } =
    useFetchProducts({
      limit: 3,
      sortBy: "createdAt",
      order: "desc",
      thumb: true,
      enabled: isOpen && !debouncedQuery,
    });

  const { products: searchProducts, isLoading: isSearchLoading } =
    useFetchProducts({
      search: debouncedQuery,
      limit: 9,
      thumb: true,
      enabled: !!debouncedQuery,
    });

  const { tags } = useFetchTags({
    search: debouncedQuery,
    limit: 6,
    enabled: !!debouncedQuery,
  });

  /* ------------------ LOGIC ------------------ */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent background scroll when mobile search is open
  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSearchClick = () => {
    setIsExpanded(true);
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submitSearch = () => {
    if (!query.trim()) return;
    setIsOpen(false);
    setIsExpanded(false);

    pushGTMEvent({
      event: "search",
      search_term: query.trim(),
    });

    router.push(`/products?q=${encodeURIComponent(query.trim())}`);
  };

  const clearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
    inputRef.current?.focus();
  };

  const closeSearch = () => {
    setIsOpen(false);
    setIsExpanded(false);
    setQuery("");
    setDebouncedQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Bar */}
      <div
        className={`flex items-center bg-gray-100 rounded-full px-4 py-2.5 transition-all duration-300 ease-in-out
          ${isExpanded ? "sm:w-[420px] shadow-md ring-2 ring-blue-500/20" : "sm:w-[200px] hover:bg-gray-150"}
          ${isOpen ? "bg-white border border-gray-200" : ""}
        `}
      >
        <button
          onClick={handleSearchClick}
          className="text-gray-500 hover:text-gray-700 transition-colors shrink-0"
        >
          <Search size={18} strokeWidth={2} />
        </button>

        <input
          ref={inputRef}
          onFocus={() => {
            setIsExpanded(true);
            setIsOpen(true);
          }}
          type="text"
          placeholder={placeholder}
          className="bg-transparent border-none outline-none px-3 text-sm w-full placeholder:text-gray-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitSearch();
            if (e.key === "Escape") closeSearch();
          }}
        />

        {query && (
          <button
            onClick={clearSearch}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 hover:bg-gray-200 rounded-full"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] sm:hidden transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Search Dropdown */}
      {isOpen && (
        <div
          className={`
            fixed sm:absolute 
            inset-0 sm:inset-auto 
            sm:top-full sm:left-0 sm:mt-2 
            w-full sm:w-[420px] 
            bg-white 
            sm:shadow-2xl
            sm:border border-gray-200 
            z-[9999] 
            flex flex-col 
            overflow-hidden
            transition-all duration-300 ease-out
            ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
          `}
        >
          {/* Mobile Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 sm:hidden bg-white sticky top-0 z-10">
            <button
              onClick={closeSearch}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
              <Search size={16} className="text-gray-400" />
              <input
                autoFocus
                className="flex-1 bg-transparent outline-none text-sm ml-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch();
                }}
              />
              {query && (
                <button onClick={clearSearch} className="text-gray-400">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="overflow-y-auto flex-1 sm:max-h-[70vh] overscroll-contain">
            <div className="p-5">
              {!debouncedQuery ? (
                <>
                  {/* Trending Products */}
                  <Section
                    title="Trending Now"
                    // icon={<TrendingUp size={14} />}
                    isGrid
                  >
                    {isTrendingLoading ? (
                      <LoadingSkeleton count={3} />
                    ) : trendingProducts?.length > 0 ? (
                      trendingProducts.map((p) => (
                        <ProductItem
                          key={p.id}
                          product={p}
                          close={closeSearch}
                        />
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-8 text-sm text-gray-400">
                        No trending products
                      </div>
                    )}
                  </Section>

                  {/* New Arrivals */}
                  <Section
                    title="New Arrivals"
                    // icon={<Sparkles size={14} />}
                    isGrid
                  >
                    {isNewArrivalLoading ? (
                      <LoadingSkeleton count={3} />
                    ) : newArrivals?.length > 0 ? (
                      newArrivals.map((p) => (
                        <ProductItem
                          key={p.id}
                          product={p}
                          close={closeSearch}
                        />
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-8 text-sm text-gray-400">
                        No new arrivals
                      </div>
                    )}
                  </Section>
                </>
              ) : (
                <>
                  {/* Search Results */}
                  <Section title="Products" icon={<Search size={14} />} isGrid>
                    {isSearchLoading ? (
                      <LoadingSkeleton count={9} />
                    ) : searchProducts?.length > 0 ? (
                      searchProducts.map((p) => (
                        <ProductItem
                          key={p.id}
                          product={p}
                          close={closeSearch}
                        />
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                          <Search size={24} className="text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          No products found
                        </p>
                        <p className="text-xs text-gray-500">
                          Try searching with different keywords
                        </p>
                      </div>
                    )}
                  </Section>

                  {/* Tags */}
                  {tags?.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <Section title="Popular Tags">
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag: any) => (
                            <button
                              key={tag.id}
                              onClick={() => {
                                closeSearch();
                                router.push(`/products?q=${tag.name}`);
                              }}
                              className="text-xs bg-gray-100 text-gray-700 px-4 py-2 rounded-full 
                                hover:bg-gray-900 hover:text-white transition-all duration-200 
                                hover:shadow-md transform hover:-translate-y-0.5"
                            >
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      </Section>
                    </div>
                  )}

                  {/* View All Results */}
                  {searchProducts?.length > 0 && (
                    <button
                      onClick={submitSearch}
                      className="w-full mt-4 py-3 bg-gray-900 text-white 
                        hover:bg-gray-800 transition-all duration-200 text-sm font-medium
                        hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      View All Results for &quot;{query}&quot;
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mobile Footer - Quick Actions */}
          <div className="sm:hidden border-t border-gray-100 p-4 bg-gray-50">
            <div className="flex gap-2">
              {/* <button
                onClick={() => {
                  closeSearch();
                  router.push("/products");
                }}
                className="flex-1 py-2.5 text-xs font-medium text-gray-700 bg-white rounded-lg border border-gray-200"
              >
                Browse All
              </button> */}
              {query && (
                <button
                  onClick={submitSearch}
                  className="flex-1 py-2.5 text-xs font-medium text-white bg-gray-900"
                >
                  Search
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchComp;
