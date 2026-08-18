/* eslint-disable @next/next/no-img-element */
import useFetchSeries from "@/hooks/Categories/Series/useFetchSeries";
import { useRouter } from "next/navigation";

const FALLBACK_IMAGE = "/images/categories/furniture-category-image.jpg";

const CategoryNavigation = () => {
  const router = useRouter();
  const { seriesList = [], isLoading } = useFetchSeries({
    isActive: true,
  });

  const handleCategoryClick = (slug: string) => {
    router.push(`/series/${slug}`);
  };

  // Skeleton items (fixed count for layout stability)
  const skeletons = Array.from({ length: 6 });

  return (
    <div className="md:hidden">
      <div className="grid grid-cols-2 gap-0.5 bg-gray-200 mt-0.5">
        {isLoading &&
          skeletons?.map((_, idx) => (
            <div
              key={idx}
              className="relative aspect-square bg-gray-300 animate-pulse"
            />
          ))}

        {!isLoading &&
          seriesList?.map((category) => (
            <div
              key={category.id}
              className="relative aspect-square overflow-hidden cursor-pointer"
              onClick={() => handleCategoryClick(category.slug)}
            >
              {/* Image */}
              <img
                src={category.image || FALLBACK_IMAGE}
                alt={category.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/30" />

              {/* Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white text-sm font-semibold text-center px-2">
                  {category.name}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CategoryNavigation;
