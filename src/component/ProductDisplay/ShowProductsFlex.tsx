import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import Image from "next/image";
import { RelatedProduct } from "@/hooks/Products/RelatedProducts/useFetchRelatedProducts";
import Link from "next/link";

type ShowProductType = {
  maxWidth?: string;
  id?: string;
  products?: RelatedProduct[];
  isLoading?: boolean;
};

const ShowProductsFlex = ({
  maxWidth,
  id,
  products,
  isLoading,
}: ShowProductType) => {
  return (
    <div className={`${maxWidth || ""} relative`}>
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={16}
        slidesPerView={1.5}
        navigation={{
          nextEl: `.swiper-button-next-${id}`,
          prevEl: `.swiper-button-prev-${id}`,
        }}
        // pagination={{
        //   clickable: true,
        //   dynamicBullets: true,
        // }}
        breakpoints={{
          640: {
            slidesPerView: 2.5,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 16,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 16,
          },
          1280: {
            slidesPerView: 5,
            spaceBetween: 16,
          },
        }}
        loop={true}
        className="pb-12"
      >
        {!isLoading && products && products.length > 0
          ? products.map((product) => (
              <SwiperSlide key={product.id}>
                <Link
                  href={`/products/${product.slug}`}
                  className="group cursor-pointer"
                >
                  <div className="aspect-3/4 bg-gray-100 mb-3 overflow-hidden relative">
                    <Image
                      alt={product.images?.[0]?.alt || product.title}
                      fill
                      className="object-cover"
                      src={
                        product.images?.[0]?.image ||
                        "/images/260X350/260X350.jpeg"
                      }
                    />
                  </div>
                  <h3 className="text-[11px] font-medium leading-tight mb-1">
                    {product.title}
                  </h3>
                </Link>
              </SwiperSlide>
            ))
          : isLoading
            ? [1, 2, 3, 4, 5, 6, 7, 8]?.map((i) => (
                <SwiperSlide key={i}>
                  <div className="group cursor-pointer">
                    <div className="aspect-3/4 bg-gray-100 mb-3 overflow-hidden">
                      <Image
                        alt="Product Image"
                        // width={260}
                        // height={350}
                        fill
                        src={"/images/260X350/260X350.jpeg"}
                      />
                      {/* <div className="w-full h-full bg-gray-200 group-hover:bg-gray-300 transition-colors" /> */}
                    </div>
                    <h3 className="text-[11px] font-medium leading-tight mb-1">
                      Recommended Item {i}
                    </h3>
                  </div>
                </SwiperSlide>
              ))
            : [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SwiperSlide key={`skeleton-${i}`}>
                  <div className="group">
                    <div className="aspect-3/4 bg-gray-200 mb-3 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                  </div>
                </SwiperSlide>
              ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <div className="absolute bottom-4 right-4 z-10 hidden md:flex gap-3">
        <button
          className={`swiper-button-prev-${id} w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors`}
          aria-label="Previous slide"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          className={`swiper-button-next-${id} w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors`}
          aria-label="Next slide"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .swiper-pagination {
          bottom: 0 !important;
        }
        .swiper-pagination-bullet {
          background: #262626;
          opacity: 0.3;
        }
        .swiper-pagination-bullet-active {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default ShowProductsFlex;
