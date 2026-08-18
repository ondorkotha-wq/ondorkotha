"use client";

import Title from "../Headers/Title";
import LoadingDots from "../Loading/LoadingDS";
import ShowProductsFlex from "../ProductDisplay/ShowProductsFlex";
import useFetchRecentlyViewedProducts from "@/hooks/Products/RecentlyViewed/useFetchRecentlyViewedProducts";

const RecentlyViewedProducts = () => {
  const { products, isLoading } = useFetchRecentlyViewedProducts({
    limit: 10,
  });

  if (isLoading) {
    <div>
      <LoadingDots />
    </div>;
  }

  return (
    <div>
      {products && products.length > 0 && (
        <>
          <Title title="Recently Viewed" />
          <ShowProductsFlex id="recent" products={products} />
        </>
      )}
    </div>
  );
};

export default RecentlyViewedProducts;
