/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Star,
  ChevronRight,
  ChevronLeft,
  Truck,
  Plus,
  StarHalf,
  Heart,
  X,
  Flame,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import useFetchAProduct from "@/hooks/Products/useFetchAProduct";
import LoadingDots from "../Loading/LoadingDS";
import { CartItem, Review } from "@/types/product.types";
import Title from "../Headers/Title";
import ShowProductsFlex from "./ShowProductsFlex";
import LikeItShareIt from "./LikeItShareIt";
import { isAuthenticated } from "@/utils/auth";
import AuthModal from "../Auth/AuthModal";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import Link from "next/link";
import useCartCount from "@/hooks/Cart/useCartCount";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";
import useFetchCarts from "@/hooks/Cart/useCarts";
import useFetchRelatedProducts from "@/hooks/Products/RelatedProducts/useFetchRelatedProducts";
import useFetchProducts from "@/hooks/Products/useFetchProducts";
import useFetchProductReview from "@/hooks/Products/Review/useFetchProductReview";
import { getVisitorId } from "@/utils/visitor";
import useIsWished from "@/hooks/Wish/useIsWished";
import { FullScreenCenter } from "../Screen/FullScreenCenter";
import { GTMProduct, pushGTMEvent } from "@/lib/gtm";
import { devLog } from "@/utils/devlog";

interface ReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
  ratingCount: number;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews,
  averageRating,
  ratingCount,
}) => {
  return (
    <section id="review" className="py-14 text-[#262626]">
      {/* Header */}
      <div className="mb-10">
        <Title title="Ratings & Reviews" />
      </div>

      {/* Summary Box */}
      <div className="flex flex-col items-center justify-center gap-2 py-10 px-6 bg-[#f9f8f6] mb-14 text-center">
        <p className="text-[13px] font-light">
          {averageRating.toFixed(1)} stars <span className="mx-1">|</span>{" "}
          {ratingCount} Review{ratingCount > 1 ? "s" : ""}
        </p>
        <div className="flex gap-0.5 text-[#eeb012]">
          {[...Array(5)].map((_, i) => {
            const starValue = i + 1;

            if (averageRating >= starValue) {
              // full star
              return (
                <Star
                  key={i}
                  size={16}
                  fill="currentColor"
                  stroke="currentColor"
                />
              );
            }

            if (averageRating >= starValue - 0.5) {
              // half star
              return (
                <StarHalf
                  key={i}
                  size={16}
                  fill="currentColor"
                  stroke="currentColor"
                />
              );
            }

            // empty star
            return <Star key={i} size={16} fill="none" stroke="currentColor" />;
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-10">
        {reviews.length === 0 && (
          <p className="text-center text-gray-500">No reviews yet.</p>
        )}

        {reviews &&
          reviews.length > 0 &&
          reviews.map((review) => (
            <div
              key={review.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-10 border-t border-gray-100 pt-12"
            >
              {/* User Info */}
              {review.user && (
                <div className="md:col-span-3 space-y-2">
                  <p className="text-[13px] font-medium">{review.user.name}</p>
                </div>
              )}

              {/* Review Content */}
              <div className="md:col-span-9">
                <div className="flex gap-0.5 text-[#eeb012] mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < review.rating ? "currentColor" : "none"}
                      stroke="currentColor"
                    />
                  ))}
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  {review.comment}
                </p>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
};

export default function ShowEachProduct() {
  const { slug } = useParams<{ slug: string }>();
  const { refetch } = useCartCount();
  const { product, isLoading } = useFetchAProduct(slug);
  devLog('single product,', product);
  const {
    cart: cartObject,
    isLoading: isCartLoading,
    refetch: refetchCart,
  } = useFetchCarts({
    productSlug: slug,
  });
  const { relatedProducts, isLoading: isRelatedLoading } =
    useFetchRelatedProducts({
      productSlug: slug,
    });
  const { products: trendingProducts, isLoading: isTrendingLoading } =
    useFetchProducts({
      limit: 8,
      sortBy: "trendScore",
      order: "desc",
    });

  const {
    reviews: reviewsData,
    averageRating,
    ratingCount,
    refetch: reviewsRefetch,
    isLoading: isReviewLoading,
  } = useFetchProductReview({
    slug: slug,
  });

  const {
    isWished,
    refetch: wishRefetch,
  } = useIsWished(slug);

  const router = useRouter();
  // State for selections
  const [selectedProductTab, setSelectedProductTab] = useState<string>("");
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingBuyNow, setPendingBuyNow] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = isLightboxOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isLightboxOpen]);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const axiosSecure = useAxiosSecure();
  const axiosPublic = useAxiosPublic();

  const productTabs = [
    {
      id: 1,
      label: "Product Details",
      content: product?.productDetails ?? "",
    },
    {
      id: 2,
      label: "Material / Dimension",
      content: product?.dimension ? `Dimensions: ${product.dimension}` : "",
    },
    {
      id: 3,
      label: "Shipping & Returns",
      content: product?.shippingReturn ?? "",
    },
  ];

  // add view
  useEffect(() => {
    const addView = async () => {
      const visitorId = await getVisitorId();

      await axiosSecure.post(`/product/view/${product?.id}`, { visitorId });

      if (product) {
        pushGTMEvent({
          event: "view_item",
          currency: "BDT",
          value: discountedPrice,
          items: [
            {
              item_id: String(product.id),
              item_name: product.title,
              price: discountedPrice,
              item_category:
                product.subCategories?.[0]?.subCategory?.category?.name || "",
              item_subCategory:
                product.subCategories?.[0]?.subCategory?.name || "",
              item_series:
                product.subCategories?.[0]?.subCategory?.category?.series
                  ?.name || "",
              item_color: currentVariant?.color?.color?.name || "",
              item_size: currentVariant?.size?.size?.name || "",
              item_material: product.material?.name || "",
              item_variant: [
                currentVariant?.color?.color?.name,
                currentVariant?.size?.size?.name,
                product.material?.name,
              ]
                .filter(Boolean)
                .join(" / "),
              is_on_sale: isDiscountActive || false,
              discount: isDiscountActive ? basePrice - discountedPrice : 0,
              availability:
                (currentVariant?.size?.quantity ?? 0) > 0
                  ? "instock"
                  : "outofstock",
            },
          ],
        });
      }
    };

    product && addView();
  }, [product]);

  // refetch cart on loading over and slug change
  useEffect(() => {
    if (!isLoading) {
      refetchCart();
    }
  }, [slug]);

  // set quantity to 1 when size changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedSizeId]);

  // Memoized derived data
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

  const cartItems = (
    Array.isArray(cartObject?.items) ? cartObject.items : []
  ) as CartItem[];

  // calculate remaining quantity
  const remainingQuantity = useMemo(() => {
    if (!currentVariant?.size?.quantity) return 0;

    const productSizeId =
      selectedSizeId || currentVariant?.color?.sizes?.[0]?.id;

    // Find cart item for this product size
    const cartItem = cartItems.find(
      (item: any) => item.productSizeId === productSizeId,
    );

    // Subtract cart quantity from available stock
    const inCartQuantity = cartItem?.quantity || 0;

    return currentVariant.size.quantity - inCartQuantity;
  }, [currentVariant, selectedSizeId, cartItems]);

  const maxQuantity = Math.min(10, remainingQuantity || 0);

  // Low-stock urgency threshold: shown only while a size is actually
  // selectable and stock is low but not exhausted.
  const LOW_STOCK_THRESHOLD = 5;
  const isLowStock =
    remainingQuantity > 0 && remainingQuantity <= LOW_STOCK_THRESHOLD;

  // Handle image logic: If color has specific images, use them; otherwise use default product images
  const displayImages = useMemo(() => {
    if (!currentVariant?.color) return product?.images || [];
    return currentVariant.color.images?.length
      ? currentVariant.color.images
      : product?.images || [];
  }, [product, currentVariant]);

  // Add to basket handler function
  const handleAddToBasket = async () => {
    if (!currentVariant?.size) {
      toast.error("Please select a size");
      return;
    }

    if (quantity < 1) {
      toast.error("Please select a quantity");
      return;
    }

    setIsAdding(true);

    try {
      const productSizeId =
        selectedSizeId || currentVariant?.color?.sizes?.[0]?.id;

      const payload = {
        productSizeId,
        quantity: quantity,
      };

      const hasUser = isAuthenticated();

      if (!hasUser) {
        const visitorId = await getVisitorId();

        await axiosPublic.post("/guest/cart/items", {
          visitorId,
          productSizeId,
          quantity,
        });
      } else {
        await axiosSecure.post("/cart/items", payload);
      }

      refetch(); // Update cart count in header

      // Show success message
      toast.success(`Added ${quantity} item${quantity > 1 ? "s" : ""} to cart`);

      if (product) {
        const salePrice = discountedPrice;
        const base = currentVariant?.size?.basePrice || product.basePrice;

        pushGTMEvent({
          event: "add_to_cart",
          currency: "BDT",
          value: salePrice * quantity,
          items: [
            {
              item_id: String(product.id),
              item_name: product.title,
              price: salePrice,
              quantity,
              item_category:
                product.subCategories?.[0]?.subCategory?.category?.name || "",
              item_subCategory:
                product.subCategories?.[0]?.subCategory?.name || "",
              item_series:
                product.subCategories?.[0]?.subCategory?.category?.series
                  ?.name || "",
              item_color: currentVariant?.color?.color?.name || "",
              item_size: currentVariant?.size?.size?.name || "",
              item_material: product.material?.name || "",
              item_variant: [
                currentVariant?.color?.color?.name,
                currentVariant?.size?.size?.name,
                product.material?.name,
              ]
                .filter(Boolean)
                .join(" / "),
              is_on_sale: base - salePrice >= 1,
              discount: Math.max(0, base - salePrice),
              availability: "instock", // user just added it, stock exists
            },
          ],
        });
      }

      setShowCartPreview(true);

      // Reset quantity to 1 after adding to cart
      setQuantity(1);

      // Hide cart preview after 3 seconds
      setTimeout(() => {
        setShowCartPreview(false);
      }, 3000);
    } catch (err: unknown) {
      process.env.NODE_ENV === "development" &&
        console.error("Error adding to basket:", err);
      if (axios.isAxiosError(err)) {
        const errorMessage = (err.response?.data as { message?: string })
          ?.message;

        // Check if it's a stock limit error
        if (
          errorMessage?.includes("Stock limit exceeded") ||
          errorMessage?.includes("Not enough stock")
        ) {
          toast.error("Not enough stock available for the selected quantity");

          // Update max quantity if needed
          const availableStock = currentVariant?.size?.quantity || 0;
          if (quantity > availableStock) {
            setQuantity(availableStock);
          }
        } else {
          toast.error(errorMessage || "Failed to add to basket");
        }
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to add to basket");
      }
    } finally {
      refetchCart();
      setIsAdding(false);
    }
  };

  const handleCheckOut = () => {
    router.push("/cart");
  };

  const handleBuyNow = async () => {
    if (!currentVariant?.size) {
      toast.error("Please select a size");
      return;
    }
    if (quantity < 1) {
      toast.error("Please select a quantity");
      return;
    }

    // Buy Now goes straight to checkout, which requires an account —
    // gate here instead of letting the user hit that wall after they've
    // already committed. Resumes automatically once signed in.
    if (!isAuthenticated()) {
      setPendingBuyNow(true);
      setIsModalOpen(true);
      return;
    }

    setIsAdding(true);
    try {
      const productSizeId = selectedSizeId || currentVariant?.color?.sizes?.[0]?.id;
      await axiosSecure.post("/cart/items", { productSizeId, quantity });

      refetch();

      if (product) {
        const salePrice = discountedPrice;
        const base = currentVariant?.size?.basePrice || product.basePrice;

        pushGTMEvent({
          event: "add_to_cart",
          currency: "BDT",
          value: salePrice * quantity,
          items: [
            {
              item_id: String(product.id),
              item_name: product.title,
              price: salePrice,
              quantity,
              item_category:
                product.subCategories?.[0]?.subCategory?.category?.name || "",
              item_subCategory:
                product.subCategories?.[0]?.subCategory?.name || "",
              item_series:
                product.subCategories?.[0]?.subCategory?.category?.series
                  ?.name || "",
              item_color: currentVariant?.color?.color?.name || "",
              item_size: currentVariant?.size?.size?.name || "",
              item_material: product.material?.name || "",
              item_variant: [
                currentVariant?.color?.color?.name,
                currentVariant?.size?.size?.name,
                product.material?.name,
              ]
                .filter(Boolean)
                .join(" / "),
              is_on_sale: base - salePrice >= 1,
              discount: Math.max(0, base - salePrice),
              availability: "instock",
            },
          ],
        });
      }

      router.push("/cart");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage = (err.response?.data as { message?: string })?.message;
        toast.error(errorMessage || "Failed to process");
      } else {
        toast.error("Failed to process");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWish = async () => {
    if (isAuthenticated()) {
      try {
        const res = await axiosSecure.patch(`wishlist/toggle/${product?.id}`);
        wishRefetch();

        if (product) {
          const salePrice = discountedPrice;
          const base = currentVariant?.size?.basePrice || product.basePrice;

          const wishlistItem: GTMProduct = {
            item_id: String(product.id),
            item_name: product.title,
            price: salePrice,
            item_category:
              product.subCategories?.[0]?.subCategory?.category?.name || "",
            item_subCategory:
              product.subCategories?.[0]?.subCategory?.name || "",
            item_series:
              product.subCategories?.[0]?.subCategory?.category?.series?.name ||
              "",
            item_color: currentVariant?.color?.color?.name || "",
            item_size: currentVariant?.size?.size?.name || "",
            item_material: product.material?.name || "",
            item_variant: [
              currentVariant?.color?.color?.name,
              currentVariant?.size?.size?.name,
              product.material?.name,
            ]
              .filter(Boolean)
              .join(" / "),
            is_on_sale: base - salePrice >= 1,
            discount: Math.max(0, base - salePrice),
            availability:
              (currentVariant?.size?.quantity ?? 0) > 0
                ? "instock"
                : "outofstock",
          };

          if (!isWished) {
            pushGTMEvent({ event: "add_to_wishlist", currency: "BDT", value: salePrice, items: [wishlistItem] });
          } else {
            pushGTMEvent({ event: "remove_from_wishlist", currency: "BDT", value: salePrice, items: [wishlistItem] });
          }
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          console.error(
            (err.response?.data as { message?: string })?.message ||
              "Failed to add wish",
          );
        } else if (err instanceof Error) {
          console.error(err.message);
        } else {
          console.error("Failed to add wish");
        }
      }
      // finally {
      //   setIsLoading(false);
      // }
    } else {
      router.push(`/login?redirect=/products/${slug}`);
    }
  };

  if (isLoading)
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  if (!product)
    return <div className="p-20 text-center">Product Not Found</div>;

  // Price Calculation
  // ProductSize has no date window of its own — its price is already final,
  // so it's used as-is rather than gating it behind the *product-level*
  // discount window (which would hide a real, currently-charged variant
  // discount whenever the product-level window happens to be inactive).
  // Falls back to product.price/basePrice — already window-checked
  // server-side via sanitizeDiscount — only when no variant is selected.
  const basePrice = currentVariant?.size?.basePrice ?? product.basePrice;
  const discountedPrice =
    currentVariant?.size?.price ?? product.price ?? basePrice;
  const isDiscountActive = basePrice - discountedPrice >= 1;
  const discountPercent = isDiscountActive
    ? Math.round(((basePrice - discountedPrice) / basePrice) * 100)
    : 0;
  const isNew =
    product.isNew ??
    (!!product.createdAt &&
      Date.now() - new Date(product.createdAt).getTime() <=
        60 * 24 * 60 * 60 * 1000);

  return (
    <div className="max-w-360 mx-auto px-4 md:px-12 py-8 font-sans text-[#222222]">
      {/* Breadcrumbs */}
      <nav className="text-[10px] uppercase tracking-widest text-gray-400 mb-6 flex flex-wrap gap-2">
        <Link
          href={`/series/${product.subCategories[0]?.subCategory?.category?.series?.slug}`}
          className="hover:text-black cursor-pointer"
        >
          {product.subCategories[0]?.subCategory?.category?.series?.name}
        </Link>
        {/* <span>/</span>
        <span className="hover:text-black cursor-pointer">
          {product.subCategories[0]?.subCategory?.category?.name}
        </span> */}
        <span>/</span>
        <span className="text-black font-semibold">
          {product.subCategories[0]?.subCategory?.name}
        </span>
      </nav>

      {/* show cart preview */}
      {showCartPreview && (
        <div className="fixed top-0 lg:top-14 right-0 left-0 lg:left-auto lg:right-4 z-50 bg-white border border-gray-200 shadow-lg w-full lg:w-80 animate-fade-in">
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm font-medium mb-4 text-center">
              {quantity || 1} {quantity && quantity > 1 ? "items" : "item"}{" "}
              added to your basket
            </p>
            <div className="hidden md:flex items-start gap-3">
              <img
                src={
                  (displayImages &&
                    displayImages[activeImgIndex] &&
                    displayImages[activeImgIndex]?.image &&
                    displayImages[activeImgIndex]?.image) ||
                  ""
                }
                alt={
                  (displayImages?.[activeImgIndex] as { alt?: string })
                    ?.alt || product.title
                }
                className="w-20 h-24 object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">{product.title}</p>
                <p className="text-xs text-gray-600 mb-1">
                  ৳{discountedPrice.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Color: {currentVariant?.color?.color?.name}
                </p>
                <p className="text-xs text-gray-500">
                  Size: {currentVariant?.size?.size?.name}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleCheckOut}
            className="w-full bg-[#4E5B6D] text-white py-3 text-xs uppercase tracking-wider hover:bg-[#3d4857] transition"
          >
            Checkout
          </button>
        </div>
      )}

      {/* display Images */}
      <div className="flex flex-col lg:flex-row gap-12 mb-20">
        {/* Left: Dynamic Image Gallery */}
        <div className="w-full lg:w-[60%] flex gap-4">
          <div className="hidden md:flex flex-col gap-2 w-20">
            {displayImages &&
              displayImages?.map((img: any, idx: number) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImgIndex(idx)}
                  className={`border ${
                    activeImgIndex === idx
                      ? "border-black"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={img.image}
                    alt={img.alt || `${product.title} thumbnail ${idx + 1}`}
                    className="w-full aspect-4/5 object-cover"
                  />
                </button>
              ))}
          </div>
          <div
            className="flex-1 relative aspect-4/5 bg-gray-100 overflow-hidden cursor-crosshair"
            onMouseMove={handleImageMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <Heart
              onClick={handleToggleWish}
              className={`
    absolute top-10 right-4 z-40 cursor-pointer
    transition-colors duration-200
    ${isWished ? "fill-red-500 stroke-red-500" : "fill-black stroke-white hover:fill-red-500"}
  `}
              strokeWidth={2}
            />

            {/* Mobile prev/next arrows */}
            {activeImgIndex > 0 && (
              <button
                onClick={() => setActiveImgIndex((i) => i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 md:hidden bg-white/80 rounded-full p-1 shadow"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {displayImages && activeImgIndex < displayImages.length - 1 && (
              <button
                onClick={() => setActiveImgIndex((i) => i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 md:hidden bg-white/80 rounded-full p-1 shadow"
              >
                <ChevronRight size={20} />
              </button>
            )}

            <img
              src={displayImages?.[activeImgIndex]?.image || ""}
              alt={
                (displayImages?.[activeImgIndex] as { alt?: string })?.alt ||
                product.title
              }
              onClick={() => setIsLightboxOpen(true)}
              className="w-full h-full object-cover transition-opacity duration-300"
              style={{
                transform: isZoomed ? "scale(2)" : "scale(1)",
                transformOrigin: zoomOrigin,
                transition: isZoomed ? "transform-origin 0s" : "transform 0.3s ease",
              }}
            />

            {/* Mobile dot indicators */}
            {displayImages && displayImages.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 md:hidden">
                {displayImages.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      activeImgIndex === idx ? "bg-black" : "bg-black/30"
                    }`}
                  />
                ))}
              </div>
            )}

            {isDiscountActive && (
              <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase">
                -{discountPercent}% OFF
              </div>
            )}

            {/* New Badge — auto-hides after 60 days from createdAt */}
            {isNew && (
              <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 uppercase">
                New!
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Interaction */}
        <div className="w-full lg:w-[40%] flex flex-col">
          <h1 className="text-3xl font-light mb-2 capitalize">
            {product.title}
          </h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5 text-[#eeb012]">
              {[...Array(5)].map((_, i) => {
                const starValue = i + 1;

                if (averageRating >= starValue) {
                  // full star
                  return (
                    <Star
                      key={i}
                      size={16}
                      fill="currentColor"
                      stroke="currentColor"
                    />
                  );
                }

                if (averageRating >= starValue - 0.5) {
                  // half star
                  return (
                    <StarHalf
                      key={i}
                      size={16}
                      fill="currentColor"
                      stroke="currentColor"
                    />
                  );
                }

                // empty star
                return (
                  <Star key={i} size={16} fill="none" stroke="currentColor" />
                );
              })}
            </div>
            <span
              // href="#review"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("review")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="text-xs text-blue-600 underline cursor-pointer"
            >
              {ratingCount || "No"} Review{ratingCount > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-baseline gap-3 mb-8">
            <p className="text-2xl font-medium">
              ৳{discountedPrice.toLocaleString()}
            </p>
            {isDiscountActive && (
              <p className="text-gray-400 line-through text-lg">৳{basePrice}</p>
            )}
          </div>
          {/* Fully out-of-stock: every color/size was filtered out server-side.
              Reached only via a direct link — listings never surface this product. */}
          {(!product.colors || product.colors.length === 0) && (
            <div className="mb-6 border border-red-200 bg-red-50 text-red-600 text-xs px-4 py-3 rounded">
              This product is currently out of stock.
            </div>
          )}
          {/* Color Selection with HexCodes */}
          {product.showColor && (
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest mb-3">
                Color: {currentVariant?.color?.color?.name}
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
                      setSelectedSizeId(null); // Reset size selection
                      setActiveImgIndex(0); // Reset image to first of new color
                    }}
                  >
                    <div
                      className="w-full h-full rounded-full overflow-hidden"
                      style={{ backgroundColor: c.color.hexCode }}
                      title={c.color.name}
                    >
                      {c.color.image && (
                        <img
                          src={c.color.image}
                          alt={c.color.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Size Selection */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-3">
              Size Selection*
            </p>
            <div className="flex flex-wrap gap-2">
              {currentVariant?.color?.sizes?.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSizeId(s.id)}
                  className={`px-4 py-2 text-xs border transition-colors ${
                    (selectedSizeId || currentVariant?.color?.sizes?.[0].id) ===
                    s.id
                      ? "border-black bg-black text-white"
                      : "border-gray-300 hover:border-black"
                  }`}
                >
                  {s.size.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-3">
              Quantity*
            </p>

            <select
              value={quantity}
              onChange={(e) => {
                const newQuantity = Number(e.target.value);
                setQuantity(newQuantity);
              }}
              disabled={remainingQuantity <= 0}
              className="w-24 border border-gray-300 px-3 py-2 text-xs
      focus:outline-none focus:border-black
      disabled:bg-gray-100 disabled:text-gray-400"
            >
              {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>

            {isCartLoading ? (
              <p className="text-xs text-gray-500 mt-2">Checking stock...</p>
            ) : remainingQuantity > 0 ? (
              <p className="text-xs text-gray-500 mt-2">
                Max: {maxQuantity} units
                {(() => {
                  const inCart =
                    cartItems?.find(
                      (item: any) =>
                        item.productSizeId ===
                        (selectedSizeId ||
                          currentVariant?.color?.sizes?.[0]?.id),
                    )?.quantity || 0;
                  return inCart > 0 ? ` (${inCart} already in cart)` : null;
                })()}
              </p>
            ) : cartItems.length > 0 ? (
              <p className="text-xs text-red-500 mt-2">
                All available units are in your cart
              </p>
            ) : (
              <p className="text-xs text-red-500 mt-2">Out of Stock</p>
            )}
          </div>

          {/* Low Stock Alert — nudges urgency once stock is scarce */}
          {isLowStock && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 border border-red-200 bg-red-50 text-red-600">
              <Flame size={14} className="shrink-0" />
              <p className="text-[11px] font-semibold">
                Hurry! Only {remainingQuantity}{" "}
                {remainingQuantity === 1 ? "product" : "products"} remaining
              </p>
            </div>
          )}

          {/* Stock Info */}
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-4">
            Availability:{" "}
            {remainingQuantity > 0
              ? `${remainingQuantity} Available`
              : currentVariant?.size?.quantity &&
                  currentVariant.size.quantity > 0
                ? "All in Cart"
                : "Out of Stock"}
          </p>

          {/* action buttons */}
          <button
            onClick={handleAddToBasket}
            disabled={
              isAdding || isCartLoading || !currentVariant?.size?.quantity
            }
            className="w-full bg-[#4E5B6D] text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#3d4857] transition mb-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isAdding
              ? "Adding..."
              : isCartLoading
                ? "Loading..."
                : "Add to Basket"}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={
              isAdding || isCartLoading || !currentVariant?.size?.quantity
            }
            className="w-full border border-[#4E5B6D] text-[#4E5B6D] py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#4E5B6D] hover:text-white transition mb-4 disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Buy Now
          </button>

          {/* Logistics from Object */}
          <div className="space-y-6 my-10">
            <div className="flex gap-4">
              <Truck size={20} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest">
                  Delivery Estimate
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {product.deliveryEstimate || "Check shipping at checkout"}
                </p>
              </div>
            </div>
          </div>
          {/* Accordions mapped to JSON keys */}
          <div className="border-t border-gray-200">
            {productTabs.map((item) => {
              const isOpen = selectedProductTab === item.label;

              return (
                <div key={item.label} className="border-b border-gray-200 py-4">
                  <div
                    onClick={() =>
                      setSelectedProductTab(isOpen ? "" : item.label)
                    }
                    className="flex justify-between items-center cursor-pointer"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {item.label}
                    </span>
                    <Plus
                      size={16}
                      className={`transition-transform ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    />
                  </div>

                  {isOpen && (
                    <div className="mt-4 text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                      {item.content || "Information not available."}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trending Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section>
          <Title title={"You may also like"} />
          <ShowProductsFlex
            id="may-also-like"
            isLoading={isRelatedLoading}
            products={relatedProducts}
          />
        </section>
      )}

      {/* Ratings & Reviews Section */}
      <section>
        <ReviewsSection
          reviews={reviewsData}
          averageRating={averageRating}
          ratingCount={ratingCount}
        />
      </section>

      {/* Trending Section */}
      {trendingProducts && trendingProducts.length > 0 && (
        <section>
          <Title title="Trending Now" />
          <ShowProductsFlex
            id="trending"
            isLoading={isTrendingLoading}
            products={trendingProducts}
          />
        </section>
      )}

      <LikeItShareIt />
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (pendingBuyNow) {
            setPendingBuyNow(false);
            // AuthModal closes itself on cancel too, so only resume if the
            // close actually reflects a completed sign-in.
            if (isAuthenticated()) {
              handleBuyNow();
            }
          }
        }}
      />

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          {/* Close */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
          >
            <X size={24} />
          </button>

          {/* Prev */}
          {activeImgIndex > 0 && (
            <button
              onClick={() => setActiveImgIndex((i) => i - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Next */}
          {displayImages && activeImgIndex < displayImages.length - 1 && (
            <button
              onClick={() => setActiveImgIndex((i) => i + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Zoomable image — touch-action lets browser handle native pinch-zoom */}
          <div
            className="w-full h-full overflow-auto flex items-center justify-center"
            style={{ touchAction: "pinch-zoom" }}
            onClick={() => setIsLightboxOpen(false)}
          >
            <img
              src={displayImages?.[activeImgIndex]?.image || ""}
              alt={
                (displayImages?.[activeImgIndex] as { alt?: string })?.alt ||
                product.title
              }
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-screen object-contain select-none"
              style={{ touchAction: "pinch-zoom" }}
            />
          </div>

          {/* Dot indicators */}
          {displayImages && displayImages.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 pointer-events-none">
              {displayImages.map((_: any, idx: number) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    activeImgIndex === idx ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
