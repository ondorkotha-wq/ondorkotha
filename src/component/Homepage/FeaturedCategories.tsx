/* eslint-disable @next/next/no-img-element */
"use client";
import useFetchFeaturedCategories from "@/hooks/Homepage/useFetchFeaturedCategories";
import Link from "next/link";

const FALLBACK = "/images/categories/furniture-category-image.jpg";

const FeaturedCategories = () => {
  const { tiles, isLoading } = useFetchFeaturedCategories();

  if (!isLoading && tiles.length === 0) return null;

  return (
    <section className="px-4 md:px-12 lg:px-40 pb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-5">Shop by Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-gray-200 animate-pulse"
              />
            ))
          : tiles.map((tile) => (
              <Link
                key={tile.id}
                href={`/series/${tile.subcategory.category.series.slug}/${tile.subcategory.category.slug}/${tile.subcategory.slug}`}
                className="group relative aspect-square overflow-hidden rounded-xl"
              >
                <img
                  src={tile.image || tile.subcategory.image || FALLBACK}
                  alt={tile.subcategory.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="text-white text-xs font-semibold leading-snug text-center drop-shadow">
                    {tile.subcategory.name}
                  </p>
                  <p className="text-white/70 text-[10px] text-center mt-0.5 leading-tight">
                    {tile.subcategory.category.name}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
};

export default FeaturedCategories;
