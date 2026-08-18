"use client";

import Image from "next/image";
import Link from "next/link";
import useFetchHomepageGallery from "@/hooks/Homepage/Gallery/useFetchHomepageGallery";

const HomepageGallery = () => {
  const { items, isLoading } = useFetchHomepageGallery(true);

  const headingItem = items.find((item) => item.isHeading);
  const galleryItems = items.filter((item) => !item.isHeading);

  const marqueeItems = [...galleryItems, ...galleryItems, ...galleryItems];

  if (isLoading || items.length === 0) return null;

  return (
    <section className="py-12 overflow-hidden hidden lg:block">
      {/* Dynamic Heading Section */}
      <div className=" mb-8">
        <div className="relative w-full h-16 md:h-24">
          <Image
            // If dynamic heading exists, use it; otherwise, use fallback
            src={
              headingItem?.image || "/images/heading/gallery-heading-photo.webp"
            }
            alt={headingItem?.name || "Our Collection"}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Marquee Wrapper (Only if we have items left) */}
      {galleryItems.length > 0 && (
        <div className="group relative flex overflow-x-hidden border-y border-gray-100 bg-white py-8">
          <div className="flex animate-marquee whitespace-nowrap group-hover:pause-animation">
            {marqueeItems.map((item, index) => (
              <Link
                href={`/products/${item.slug}`}
                key={`${item.id}-${index}`}
                className="inline-flex flex-col items-center mx-6 transition-transform duration-300 hover:scale-105"
                style={{ minWidth: "220px" }}
              >
                {/* Image Card */}
                <div className="relative w-full aspect-3/5 overflow-hidden rounded-xl bg-gray-100 shadow-sm transition-shadow duration-300 hover:shadow-xl">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                </div>

                {/* Label */}
                <p className="mt-2 text-sm font-medium text-center text-gray-800 cursor-pointer border-b hover:border-transparent transition-all">
                  {item.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default HomepageGallery;
