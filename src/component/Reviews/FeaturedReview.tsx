/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import useFetchFeaturedReview from "@/hooks/Products/Review/useFetchFeaturedReview";
import { useRouter } from "next/navigation";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400&family=Jost:wght@300;400;500&display=swap');

.ondorkotha-slim-text { font-family: 'Jost', sans-serif; }
.ondorkotha-slim-display { font-family: 'Cormorant Garamond', serif; }
`;

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    className={filled ? "fill-[#c9a96e] stroke-[#c9a96e]" : "stroke-[#c9a96e] opacity-30"}
  >
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

const FeaturedReview = () => {
  const { review, isLoading } = useFetchFeaturedReview();
  const router = useRouter();

  if (isLoading || !review) return null;

  const userName = review?.orderItem?.order?.user?.name ?? "A valued customer";
  const productTitle = review?.orderItem?.product?.title;
  const productSlug = review?.orderItem?.product?.slug;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <section
        onClick={() => productSlug && router.push(`/products/${productSlug}`)}
        className="cursor-pointer bg-[#0f0e0c] border-y border-[#1a1814] py-8 px-4 transition-all hover:bg-[#141311]"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0">
          
          {/* Mobile Stars (Hidden on Desktop) */}
          <div className="flex md:hidden gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon key={s} filled={s <= (review.rating ?? 5)} />
            ))}
          </div>

          {/* Left Side (Desktop Only) */}
          <div className="hidden md:flex flex-col gap-1.5 pr-8 border-r border-[#1a1814] min-w-[140px]">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <StarIcon key={s} filled={s <= (review.rating ?? 5)} />
              ))}
            </div>
            <span className="ondorkotha-slim-text text-[9px] tracking-[0.2em] text-[#c9a96e] uppercase font-bold">
              Customer Favorite
            </span>
          </div>

          {/* Middle: The Quote (Full width on mobile) */}
          <div className="flex-1 px-0 md:px-10 text-center">
            <p className="ondorkotha-slim-display italic text-[1.15rem] md:text-[1.3rem] text-[#ede8df] leading-relaxed line-clamp-3 md:line-clamp-2">
              “{review.comment}”
            </p>
          </div>

          {/* Right Side / Mobile Attribution */}
          <div className="md:pl-8 md:border-l border-[#1a1814] text-center md:text-left">
            <p className="ondorkotha-slim-text text-[11px] font-medium text-[#ede8df] uppercase tracking-wider mb-0.5">
              {userName}
            </p>
            <p className="ondorkotha-slim-text text-[10px] text-[#7a6e5e]">
              Verified Buyer <span className="hidden sm:inline">—</span> <br className="sm:hidden" />
              <span className="text-[#c9a96e] font-medium ml-1 md:ml-0">{productTitle}</span>
            </p>
          </div>

        </div>
      </section>
    </>
  );
};

export default FeaturedReview;