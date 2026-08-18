"use client";

import useFetchFeaturedProducts from "@/hooks/Products/Featured/useFetchFeaturedProducts";
import ShowProductsFlex from "../ProductDisplay/ShowProductsFlex";
import Title from "../Headers/Title";

const FeaturedProducts = ({ limit = 10 }: { limit?: number }) => {
  const { products, isLoading } = useFetchFeaturedProducts({ limit });

  if (!isLoading && products.length === 0) return null;

  return (
    <div>
      <Title title="Featured Picks" />
      <ShowProductsFlex id="featured" products={products} isLoading={isLoading} />
    </div>
  );
};

export default FeaturedProducts;
