/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
"use client";

import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, CheckSquare, Square } from "lucide-react";
import toast from "react-hot-toast";
import LoadingDots from "../../Loading/LoadingDS";
import useWishlist from "@/hooks/Wish/useWishlist";
import { useRouter } from "next/navigation";
import { pushGTMEvent } from "@/lib/gtm";

const WishlistComponent = () => {
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  const { wishlist, isLoading, refetch, meta } = useWishlist({
    page,
    limit: LIMIT,
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const removeItem = async (id: number) => {
    try {
      await axiosSecure.patch(`/wishlist/toggle/${id}`);

      const found = wishlist.find((item) => item.id === id);
      if (found) {
        pushGTMEvent({
          event: "remove_from_wishlist",
          currency: "BDT",
          value: found.price,
          items: [
            {
              item_id: String(found.id),
              item_name: found.title,
              price: found.price,
              discount:
                found.basePrice > found.price
                  ? found.basePrice - found.price
                  : 0,
              is_on_sale: found.basePrice > found.price,
            },
          ],
        });
      }

      refetch();
      toast.success("Removed from your collection");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    if (selectedIds.length === wishlist.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(wishlist.map((item) => item.id));
    }
  };

  const removeSelected = async () => {
    if (selectedIds.length === 0) return;

    try {
      await Promise.all(
        selectedIds.map((id) => axiosSecure.patch(`/wishlist/toggle/${id}`)),
      );

      selectedIds.forEach((id) => {
        const found = wishlist.find((item) => item.id === id);
        if (found) {
          pushGTMEvent({
            event: "remove_from_wishlist",
            currency: "BDT",
            value: found.price,
            items: [
              {
                item_id: String(found.id),
                item_name: found.title,
                price: found.price,
                discount:
                  found.basePrice > found.price
                    ? found.basePrice - found.price
                    : 0,
                is_on_sale: found.basePrice > found.price,
              },
            ],
          });
        }
      });

      toast.success(`${selectedIds.length} items removed`);

      setSelectedIds([]);
      setSelectionMode(false);
      refetch();
    } catch {
      toast.error("Failed to remove selected items");
    }
  };

  const cancelSelection = () => {
    setSelectedIds([]);
    setSelectionMode(false);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  // Clear selection when changing pages
  useEffect(() => {
    setSelectedIds([]);
  }, [page]);

  const handleProductClick = (item: any) => {
    if (selectionMode) {
      toggleSelect(item.id);
    } else {
      router.push(`/products/${item.slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdfa]">
      <div className="max-w-400 mx-auto px-6 py-12">
        {/* Breadcrumb & Header */}
        <nav className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-8">
          <Link href="/" className="hover:text-black">
            Home
          </Link>{" "}
          / <span>Wishlist</span>
        </nav>

        <header className="border-b border-gray-100 pb-8 mb-12 flex flex-col md:flex-row justify-between items-baseline gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl text-[#262626] font-light italic mb-3">
              My Favorites
            </h1>
            <p className="text-gray-500 font-light tracking-wide">
              {meta.total} {meta.total === 1 ? "Product" : "Products"} Saved
            </p>
          </div>
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.2em] font-medium border-b border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors"
          >
            Continue Shopping
          </Link>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <LoadingDots />
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-32">
            <h3 className="text-2xl font-serif italic text-gray-400">
              Your collection is empty...
            </h3>
            <Link
              href="/"
              className="mt-8 inline-block bg-[#4b5e54] text-white px-10 py-3 text-sm uppercase tracking-widest hover:bg-black transition-all"
            >
              Discover New Pieces
            </Link>
          </div>
        ) : (
          <>
            {/* Selection Controls Bar */}
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-100 p-4 rounded-sm">
              {!selectionMode ? (
                <button
                  onClick={() => setSelectionMode(true)}
                  className="text-xs uppercase tracking-[0.2em] font-medium text-gray-600 hover:text-black transition-colors"
                >
                  Select Items
                </button>
              ) : (
                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    onClick={selectAll}
                    className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-medium text-gray-700 hover:text-black transition-colors"
                  >
                    {selectedIds.length === wishlist.length ? (
                      <CheckSquare size={18} strokeWidth={1.5} />
                    ) : (
                      <Square size={18} strokeWidth={1.5} />
                    )}
                    {selectedIds.length === wishlist.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>

                  {selectedIds.length > 0 && (
                    <span className="text-xs text-gray-500 font-light">
                      {selectedIds.length} selected
                    </span>
                  )}
                </div>
              )}

              {selectionMode && (
                <div className="flex items-center gap-3">
                  {selectedIds.length > 0 && (
                    <button
                      onClick={removeSelected}
                      className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 text-xs uppercase tracking-[0.15em] font-medium hover:bg-red-100 transition-colors rounded-sm"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                      Remove ({selectedIds.length})
                    </button>
                  )}
                  <button
                    onClick={cancelSelection}
                    className="text-xs uppercase tracking-[0.15em] font-medium text-gray-500 hover:text-black transition-colors px-3"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* The Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {wishlist?.map((item) => (
                <div key={item.id} className="group flex flex-col relative">
                  {/* Selection Checkbox */}
                  {selectionMode && (
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className="absolute top-3 left-3 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-sm shadow-sm hover:bg-white transition-all"
                    >
                      {selectedIds.includes(item.id) ? (
                        <CheckSquare
                          size={20}
                          strokeWidth={1.5}
                          className="text-black"
                        />
                      ) : (
                        <Square
                          size={20}
                          strokeWidth={1.5}
                          className="text-gray-400"
                        />
                      )}
                    </button>
                  )}

                  {/* Image Container */}
                  <div
                    className={`relative aspect-3/4 overflow-hidden bg-gray-50 mb-4 transition-all ${
                      selectedIds.includes(item.id)
                        ? "ring-2 ring-black ring-offset-2"
                        : ""
                    }`}
                  >
                    <div onClick={() => handleProductClick(item)}>
                      <img
                        src={item.images?.[0]?.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </div>

                    {/* Delete Button - Only show when not in selection mode */}
                    {!selectionMode && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-gray-600 hover:text-red-500"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-col grow">
                    <Link href={`/products/${item.slug}`}>
                      <h3 className="text-[15px] text-[#262626] font-serif group-hover:underline decoration-1 underline-offset-4 mb-1 leading-tight">
                        {item.title}
                      </h3>
                    </Link>

                    {/* Color Swatch Preview */}
                    <div className="flex gap-1.5 my-2">
                      {item.colors?.slice(0, 3).map((c, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full border border-gray-200"
                          style={{ backgroundColor: c.color.hexCode }}
                        />
                      ))}
                    </div>

                    <div className="mt-auto pt-1">
                      <span className="text-[14px] text-gray-700 tracking-tight">
                        ৳{item.price.toLocaleString()}
                      </span>
                      {item.basePrice > item.price && (
                        <span className="ml-2 text-[12px] text-red-700 line-through">
                          ৳{item.basePrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="mt-20 flex justify-center items-center gap-8 border-t border-gray-100 pt-10">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-[10px] uppercase tracking-widest disabled:text-gray-300 font-bold hover:text-black transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs font-serif italic text-gray-500">
                  Page {page} of {meta.totalPages}
                </span>
                <button
                  disabled={page === meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-[10px] uppercase tracking-widest disabled:text-gray-300 font-bold hover:text-black transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistComponent;
