"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Product } from "@/types/product.types";
import useFetchSeriesWiseProducts from "@/hooks/Products/useFetchSeriesWiseProducts";
import useFetchActiveFlashSale from "@/hooks/Homepage/useFetchActiveFlashSale";
import EachProductShow from "@/component/ProductDisplay/EachProductShow";
import BottomPagination from "@/component/Pagination/BottomPagination";
import { QuickShopModal } from "@/component/ProductDisplay/QuickShopModal";
import LoadingDots from "@/component/Loading/LoadingDS";
import FlashSaleCountdown from "./FlashSaleCountdown";

const PRODUCTS_PER_PAGE = 18;

export default function FlashSalesComp() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productImage, setProductImage] = useState("");
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  const { products, meta, isLoading, isFetching } = useFetchSeriesWiseProducts(
    "sale",
    { page: currentPage, limit: PRODUCTS_PER_PAGE },
  );
  const { flashSale } = useFetchActiveFlashSale();

  const totalPages = meta?.totalPages || 1;
  const totalProducts = meta?.total || 0;

  const heroTitle = flashSale?.title ?? "Flash Sales";
  const heroText =
    flashSale?.bannerText ??
    "Limited-time deals — grab them before they're gone!";

  const endDate = flashSale ? new Date(flashSale.endDate) : null;
  const showCountdown = !!endDate && endDate > new Date();

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 font-sans text-[#222222]">
      {/* Hero banner */}
      <div className="rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-6 py-10 mb-8 text-white text-center shadow-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap size={28} className="fill-white text-white" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {heroTitle}
          </h1>
          <Zap size={28} className="fill-white text-white" />
        </div>
        <p className="text-red-100 mb-6 text-sm md:text-base">{heroText}</p>

        {showCountdown && endDate && (
          <FlashSaleCountdown endDate={endDate} label="Flash Sale ends in" />
        )}
      </div>

      {/* Product count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {isLoading ? "Loading..." : `${totalProducts} sale items`}
        </p>
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingDots />
        </div>
      ) : products.length > 0 ? (
        <EachProductShow
          products={products}
          setSelectedProduct={setSelectedProduct}
          productImage={productImage}
          hoveredProduct={hoveredProduct}
          setProductImage={setProductImage}
          setHoveredProduct={setHoveredProduct}
        />
      ) : (
        <div className="text-center py-24 text-gray-400 text-lg">
          No sale items at the moment. Check back soon!
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <BottomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          handlePrevPage={handlePrev}
          handleNextPage={handleNext}
        />
      )}

      {isFetching && !isLoading && (
        <div className="fixed inset-0 bg-white/50 z-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      )}

      {selectedProduct && (
        <QuickShopModal
          slug={selectedProduct.slug}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
