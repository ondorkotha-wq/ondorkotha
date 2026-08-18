/* eslint-disable @next/next/no-img-element */
import useFetchActiveBroadBanner from "@/hooks/Homepage/Banner/useFetchActiveBroadBanner";
import Link from "next/link";

const BroadBanner = () => {
  const { banner, isLoading } = useFetchActiveBroadBanner();

  // 1. Skeleton State: Matches the dimensions and aspect ratio of the hero image
  if (isLoading) {
    return (
      <div className="w-full relative overflow-hidden bg-gray-200 animate-pulse aspect-[16/9] md:aspect-[21/9] lg:aspect-[32/9]">
        {/* Subtle gradient overlay to make the pulse look more "premium" */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    );
  }

  // 2. Empty State: Graceful handling if no banner is returned
  if (!banner) return null;

  return (
    <Link
      href={banner.link || "#"}
      className="block w-full overflow-hidden transition-opacity hover:opacity-95"
    >
      <img
        src={banner.image || "/images/home/homepage-large-image.jpg"}
        alt={banner.title || "Promotional Banner"}
        // Standardizing height/aspect ratio to prevent Layout Shift
        className="w-full h-auto object-cover aspect-video md:aspect-21/9 lg:aspect-32/9"
        loading="eager" // Hero banners should load immediately
        fetchPriority="high"
      />
    </Link>
  );
};

export default BroadBanner;
