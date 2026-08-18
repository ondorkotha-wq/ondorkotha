/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import { Product } from "@/types/product.types";
import { ChevronLeft, ChevronRight, Heart, X } from "lucide-react";
import { useMemo, useState } from "react";
import TakaIcon from "../TakaIcon";
import { useRouter } from "next/navigation";
import useFetchAProduct from "@/hooks/Products/useFetchAProduct";
import LoadingDots from "../Loading/LoadingDS";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";

export function QuickShopModal({
  slug,
  onClose,
}: {
  slug?: string;
  onClose: () => void;
}) {
  const { product, isLoading } = useFetchAProduct(slug);

  console.log(product, "product");
  const router = useRouter();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const axiosSecure = useAxiosSecure();

  // Memoized current variant (follows ShowEachProduct pattern)
  const currentVariant = useMemo(() => {
    if (!product) return null;
    const color = product.colors.find(
      (c: any) => c.id === (selectedColorId || product.colors[0]?.id),
    );
    const size = color?.sizes?.find(
      (s: any) => s.id === (selectedSizeId || color?.sizes?.[0]?.id),
    );
    return { color, size };
  }, [product, selectedColorId, selectedSizeId]);

  // Display images logic (follows ShowEachProduct pattern)
  const displayImages = useMemo(() => {
    if (!currentVariant?.color) return product?.images || [];
    return currentVariant.color.images?.length
      ? currentVariant.color.images.length > 0 && currentVariant.color.images
      : product?.images || [];
  }, [product, currentVariant]);

  const sortedImages = useMemo(() => {
    return [...(displayImages || [])].sort((a, b) => a.serialNo - b.serialNo);
  }, [displayImages]);

  if (isLoading)
    return (
      <div>
        <LoadingDots />
      </div>
    );

  if (!product) return null;

  // ProductSize has no date window of its own — its price is already final,
  // so it's used as-is rather than gating it behind the *product-level*
  // discount window (which would hide a real, currently-charged variant
  // discount whenever the product-level window happens to be inactive).
  // Falls back to product.price/basePrice — already window-checked
  // server-side via sanitizeDiscount — only when no variant is selected.
  const basePrice = currentVariant?.size?.basePrice ?? product.basePrice;
  const discountedPrice =
    currentVariant?.size?.price ?? product.price ?? basePrice;

  console.log(discountedPrice, "discountedPrice");

  const maxQuantity = Math.min(10, currentVariant?.size?.quantity || 0);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : sortedImages.length - 1,
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev < sortedImages.length - 1 ? prev + 1 : 0,
    );
  };

  const handleAddToBasket = async () => {
    router.push(`/products/${product.slug}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="bg-white w-full max-w-[900px] relative flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 text-gray-400 hover:text-black transition"
        >
          <X size={24} strokeWidth={1.5} />
        </button>

        {/* Left Side: Image Gallery */}
        <div className="w-full md:w-[55%] relative group bg-[#F9F9F9]">
          <div className="absolute top-4 right-4 z-10 bg-white/80 px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold">
            <Heart size={12} fill="currentColor" /> 596
          </div>
          <img
            src={sortedImages[currentImageIndex]?.image}
            alt={
              (sortedImages[currentImageIndex] as { alt?: string })?.alt ||
              product.title
            }
            className="w-full h-full object-cover aspect-square md:aspect-auto"
          />

          {/* Gallery Nav - Only show if multiple images */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 opacity-0 group-hover:opacity-100 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 opacity-0 group-hover:opacity-100 transition"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                {sortedImages?.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full ${
                      idx === currentImageIndex ? "bg-black" : "bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Side: Product Details */}
        <div className="w-full md:w-[45%] p-8 md:p-10 flex flex-col overflow-y-auto max-h-[90vh]">
          <h2 className="text-xl md:text-2xl font-light leading-tight mb-2 pr-6">
            {product.title}
          </h2>

          <div className="mb-6">
            {discountedPrice < basePrice ? (
              <div className="flex items-center gap-3">
                <p className="text-lg font-medium text-red-600">
                  <TakaIcon /> {discountedPrice}
                </p>
                <p className="text-sm text-gray-400 line-through">
                  <TakaIcon /> {basePrice}
                </p>
                {basePrice - discountedPrice >= 1 && (
                  <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded">
                    ৳{basePrice - discountedPrice} OFF
                  </span>
                )}
              </div>
            ) : (
              <p className="text-lg font-medium">
                <TakaIcon /> {basePrice}
              </p>
            )}
          </div>

          <hr className="border-gray-100 mb-6" />

          {/* Color Selection */}
          {product.showColor && product.colors.length > 0 && (
            <div className="mb-6">
              <p className="text-xs mb-3 text-gray-500 uppercase tracking-widest font-semibold">
                Color:{" "}
                <span className="text-black ml-1">
                  {currentVariant?.color?.color?.name ||
                    product.colors[0]?.color?.name}
                </span>
              </p>
              <div className="flex gap-3">
                {product.colors?.map((c: any) => (
                  <button
                    key={c.id}
                    className={`w-10 h-10 rounded-full border-2 p-0.5 transition-all ${
                      (selectedColorId || product.colors[0].id) === c.id
                        ? "border-black scale-110"
                        : "border-gray-200"
                    }`}
                    onClick={() => {
                      setSelectedColorId(c.id);
                      setCurrentImageIndex(0);
                      setSelectedSizeId(null); // Reset size selection
                    }}
                  >
                    <div
                      className="w-full h-full rounded-full"
                      style={{ backgroundColor: c.color.hexCode }}
                      title={c.color.name}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {currentVariant?.color?.sizes &&
            currentVariant.color.sizes.length > 0 && (
              <div className="mb-6">
                <p className="text-xs mb-3 text-gray-500 uppercase tracking-widest font-semibold">
                  Size:{" "}
                  <span className="text-black ml-1">
                    {currentVariant?.size?.size?.name || "Select"}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentVariant.color.sizes.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSizeId(s.id)}
                      disabled={s.quantity === 0}
                      className={`px-4 py-2 text-xs border transition-colors ${
                        (selectedSizeId ||
                          currentVariant?.color?.sizes?.[0].id) === s.id
                          ? "border-black bg-black text-white"
                          : "border-gray-300 hover:border-black"
                      } ${
                        s.quantity === 0 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {s.size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Product Details */}
          {product.productDetails && (
            <div className="mb-6">
              <p className="text-xs text-gray-600 leading-relaxed">
                {product.productDetails}
              </p>
            </div>
          )}

          {/* Dimensions */}
          {product.dimension && (
            <div className="mb-6">
              <p className="text-xs mb-1 text-gray-500 uppercase tracking-widest font-semibold">
                Dimensions
              </p>
              <p className="text-xs text-gray-600">{product.dimension}</p>
            </div>
          )}

          {/* Delivery Estimate */}
          {product.deliveryEstimate && (
            <div className="mb-6">
              <p className="text-xs text-green-600">
                📦 {product.deliveryEstimate}
              </p>
            </div>
          )}

          {/* Stock Info */}
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-4">
            Availability:{" "}
            {currentVariant?.size?.quantity
              ? `${currentVariant.size.quantity} In Stock`
              : "Out of Stock"}
          </p>

          {/* Qty & Add to Cart */}
          <div className="flex gap-2 mb-4">
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={!currentVariant?.size?.quantity}
              className="border border-gray-300 px-4 py-3 text-xs appearance-none bg-white min-w-[60px] disabled:bg-gray-100 disabled:text-gray-400"
            >
              {Array.from({ length: maxQuantity }, (_, i) => i + 1)?.map(
                (num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ),
              )}
            </select>
            <button
              onClick={handleAddToBasket}
              disabled={!currentVariant?.size?.quantity}
              className="flex-1 bg-[#4E5B6D] text-white text-[11px] font-bold uppercase tracking-[0.2em] py-4 hover:bg-[#3d4857] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {currentVariant?.size?.quantity === 0
                ? "Out of Stock"
                : "View Full Details"}
            </button>
          </div>

          {/* Note */}
          {product.note && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-[10px] text-yellow-800">{product.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
