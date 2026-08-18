"use client";
import useFetchSeasonalCategories from "@/hooks/Homepage/SeasonalCategories/useFetchSeasonalCategories";
import Image from "next/image";
import Link from "next/link";

const SeasonalCategory = () => {
  const { categories: seasonalCategories, isLoading } =
    useFetchSeasonalCategories();

  if (isLoading) {
    return (
      <div className="w-full px-4 my-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6 lg:gap-10">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="w-full aspect-4/1 bg-gray-200 animate-pulse rounded-md"
          />
        ))}
      </div>
    );
  }

  return (
    <nav className="w-full px-4 my-8" aria-label="Seasonal categories">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6 lg:gap-10">
        {seasonalCategories?.map((item) => (
          <Link key={item.id} href={item.link || "#"} className="group">
            <div className="relative w-full aspect-4/1 overflow-hidden rounded-md transition-transform duration-200 group-hover:scale-[1.02]">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                className="object-cover"
                priority={true}
              />
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default SeasonalCategory;
