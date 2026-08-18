"use client";

import useFetchTrendingProducts from "@/hooks/Products/Trending/useFetchTrendingProducts";
import ShowProductsFlex from "../ProductDisplay/ShowProductsFlex";

const TrendingProducts = ({ limit = 10 }: { limit?: number }) => {
  const { products, isLoading } = useFetchTrendingProducts({ limit });

  return (
    <div>
      <ShowProductsFlex id="trending" products={products} isLoading={isLoading} />
    </div>
  );
};

export default TrendingProducts;
