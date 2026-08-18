"use client";

import useFetchFeaturedReviews from "@/hooks/Products/Review/useFetchFeaturedReviews";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Review } from "@/types/product.types";

// ─── Sub-components ────────────────────────────────────────────────────────────

const StarRow = ({ rating, size = 11 }: { rating: number; size?: number }) => (
  <div className="flex gap-1 justify-center">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg
        key={s}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={
          s <= rating
            ? "fill-[#c9a96e] stroke-[#c9a96e]"
            : "stroke-[#c9a96e] opacity-25 fill-none"
        }
      >
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ))}
  </div>
);

const QuoteMark = () => (
  <svg
    width="36"
    height="28"
    viewBox="0 0 36 28"
    fill="none"
    className="opacity-20"
    aria-hidden="true"
  >
    <path
      d="M0 28V17.6C0 13.387 1.013 9.787 3.04 6.8C5.12 3.813 8.267 1.6 12.48 0.16L14.24 3.04C11.627 4.053 9.627 5.44 8.24 7.2C6.907 8.96 6.24 11.04 6.24 13.44H12.48V28H0ZM21.76 28V17.6C21.76 13.387 22.773 9.787 24.8 6.8C26.88 3.813 30.027 1.6 34.24 0.16L36 3.04C33.387 4.053 31.387 5.44 30 7.2C28.667 8.96 28 11.04 28 13.44H34.24V28H21.76Z"
      fill="#c9a96e"
    />
  </svg>
);

const TestimonialCard = ({
  review,
  onClick,
}: {
  review: Review;
  onClick: () => void;
}) => {
  const userName = review.orderItem?.order?.user?.name ?? "A valued customer";
  const productTitle = review.orderItem?.product?.title;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer h-full flex flex-col items-center text-center px-6 md:px-12 py-10 select-none"
    >
      {/* Quote icon */}
      <div className="mb-6">
        <QuoteMark />
      </div>

      {/* Stars */}
      <StarRow rating={review.rating} size={12} />

      {/* Comment */}
      <blockquote className="mt-6 mb-8 flex-1">
        <p
          className="font-[Cormorant_Garamond] italic text-[1.25rem] md:text-[1.45rem] text-[#ede8df] leading-relaxed line-clamp-4 group-hover:text-white transition-colors duration-500"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          &ldquo;{review.comment}&rdquo;
        </p>
      </blockquote>

      {/* Divider */}
      <div className="w-8 h-px bg-[#c9a96e] opacity-40 mb-6" />

      {/* Attribution */}
      <footer>
        <p
          className="text-[12px] font-medium text-[#ede8df] uppercase tracking-[0.2em] mb-1"
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          {userName}
        </p>
        <p
          className="text-[10px] text-[#7a6e5e] tracking-wide"
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          Verified Buyer{" "}
          <span className="text-[#c9a96e] font-medium ml-1">
            — {productTitle}
          </span>
        </p>
      </footer>
    </div>
  );
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="flex flex-col items-center text-center px-6 md:px-12 py-10 animate-pulse">
    <div className="w-9 h-7 bg-[#1e1c18] rounded mb-6" />
    <div className="flex gap-1 justify-center mb-6">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className="w-3 h-3 rounded-full bg-[#1e1c18]" />
      ))}
    </div>
    <div className="space-y-3 w-full max-w-md mb-8">
      <div className="h-4 bg-[#1e1c18] rounded mx-auto w-4/5" />
      <div className="h-4 bg-[#1e1c18] rounded mx-auto w-3/5" />
      <div className="h-4 bg-[#1e1c18] rounded mx-auto w-4/5" />
    </div>
    <div className="w-8 h-px bg-[#1e1c18] mb-6" />
    <div className="h-3 w-24 bg-[#1e1c18] rounded mb-2 mx-auto" />
    <div className="h-3 w-32 bg-[#1e1c18] rounded mx-auto" />
  </div>
);

// ─── Main Section ─────────────────────────────────────────────────────────────

const swiperStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500&family=Jost:wght@300;400;500&display=swap');

  .ondorkotha-testimonials .swiper-pagination {
    bottom: 0 !important;
  }

  .ondorkotha-testimonials .swiper-pagination-bullet {
    width: 5px;
    height: 5px;
    background: #c9a96e;
    opacity: 0.25;
    transition: opacity 0.3s, transform 0.3s;
  }

  .ondorkotha-testimonials .swiper-pagination-bullet-active {
    opacity: 1;
    transform: scale(1.4);
  }

  .ondorkotha-testimonials .swiper-button-prev,
  .ondorkotha-testimonials .swiper-button-next {
    color: #c9a96e;
    opacity: 0.35;
    transition: opacity 0.3s;
    top: 50%;
    transform: translateY(-50%);
  }

  .ondorkotha-testimonials .swiper-button-prev:hover,
  .ondorkotha-testimonials .swiper-button-next:hover {
    opacity: 0.85;
  }

  .ondorkotha-testimonials .swiper-button-prev::after,
  .ondorkotha-testimonials .swiper-button-next::after {
    font-size: 14px;
    font-weight: 700;
  }

  .ondorkotha-testimonials .swiper-button-prev {
    left: 4px;
  }

  .ondorkotha-testimonials .swiper-button-next {
    right: 4px;
  }
`;

export default function TestimonialsSection() {
  const { reviews, isLoading } = useFetchFeaturedReviews();
  const router = useRouter();

  const hasReviews = !isLoading && reviews && reviews.length > 0;

  if (reviews.length === 0) {
    return null; // Don't render the section if there are no reviews
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: swiperStyles }} />

      <section className="bg-[#0a0908] border-y border-[#1a1814] py-16 md:py-20 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          {/* Section header */}
          <header className="text-center mb-12">
            <div
              className="flex items-center justify-center gap-3 text-[#c9a96e] uppercase tracking-[0.3em] text-[9px] mb-4"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              <span className="h-px w-10 bg-[#c9a96e] opacity-40" />
              <span>Voices of our home</span>
              <span className="h-px w-10 bg-[#c9a96e] opacity-40" />
            </div>

            <h2
              className="text-3xl md:text-4xl font-light italic text-[#ede8df] tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Loved by thoughtful homes
            </h2>
          </header>

          {/* Swiper */}
          <div className="ondorkotha-testimonials relative pb-10">
            {isLoading ? (
              <SkeletonCard />
            ) : !hasReviews ? null : (
              <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                spaceBetween={0}
                slidesPerView={1}
                centeredSlides
                loop={reviews.length > 1}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                pagination={{ clickable: true }}
                navigation={reviews.length > 1}
                speed={700}
              >
                {reviews.map((review: Review) => (
                  <SwiperSlide key={review.id}>
                    <TestimonialCard
                      review={review}
                      onClick={() =>
                        review.orderItem?.product?.slug &&
                        router.push(
                          `/products/${review.orderItem.product.slug}`,
                        )
                      }
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>

          {/* Trust footnote */}
          {hasReviews && (
            <p
              className="text-center text-[9px] uppercase tracking-[0.25em] text-[#3d3730] mt-2"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              All reviews are from verified purchases
            </p>
          )}
        </div>
      </section>
    </>
  );
}
