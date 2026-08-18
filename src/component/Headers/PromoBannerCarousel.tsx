"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, A11y } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PromoBanner } from "@/types/promo-banner";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface PromoBannerCarouselProps {
  banners: PromoBanner[];
}

export default function PromoBannerCarousel({
  banners,
}: PromoBannerCarouselProps) {
  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, A11y]}
        speed={600} // smooth but not slow
        loop={banners.length > 1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        navigation={{
          nextEl: ".promo-next",
          prevEl: ".promo-prev",
        }}
        pagination={{
          clickable: true,
          el: ".promo-pagination",
        }}
        slidesPerView={1}
        spaceBetween={0}
        className="w-full"
      >
        {banners?.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div
              className="w-full py-2 px-10 flex items-center justify-center text-center transition-colors duration-300"
              style={{ backgroundColor: banner.bgColor }}
            >
              <div className="text-white text-sm md:text-base font-medium flex flex-wrap items-center justify-center gap-4">
                <span>{banner.text}</span>

                {banner.links?.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold hover:opacity-80 transition-opacity"
                  >
                    {link.text}
                  </a>
                ))}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            className="promo-prev absolute left-3 top-1/2 -translate-y-1/2 z-10 text-white opacity-70 hover:opacity-100 transition"
            aria-label="Previous banner"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            className="promo-next absolute right-3 top-1/2 -translate-y-1/2 z-10 text-white opacity-70 hover:opacity-100 transition"
            aria-label="Next banner"
          >
            <ChevronRight size={22} />
          </button>

          {/* Pagination Dots */}
          <div className="promo-pagination absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-2"></div>
        </>
      )}
    </div>
  );
}
