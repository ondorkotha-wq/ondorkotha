/* eslint-disable @next/next/no-img-element */
"use client";
import useFetchSeries from "@/hooks/Categories/Series/useFetchSeries";
import Link from "next/link";

const FALLBACK = "/images/categories/furniture-category-image.jpg";

const AllSeriesGrid = () => {
  const { seriesList, isLoading } = useFetchSeries({ isActive: true });

  return (
    <section className="px-4 md:px-12 lg:px-40 pb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-5">All Categories</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-gray-200 animate-pulse"
              />
            ))
          : seriesList.map((series) => (
              <Link
                key={series.id}
                href={`/series/${series.slug}`}
                className="group relative aspect-square overflow-hidden rounded-xl"
              >
                <img
                  src={series.image || FALLBACK}
                  alt={series.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="text-white text-xs font-semibold text-center drop-shadow">
                    {series.name}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
};

export default AllSeriesGrid;
