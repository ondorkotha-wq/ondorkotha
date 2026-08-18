import ProductTypeWiseProducts from "@/component/ProductDisplay/ByCategory/ProductTypeWiseProducts";
import FeaturedReview from "@/component/Reviews/FeaturedReview";

const ProductTypePage = () => {
  return (
    <div>
      <ProductTypeWiseProducts />

      {/* Featured Review */}
      <div className="px-4 md:px-12 lg:px-40 pb-8">
        <FeaturedReview />
      </div>
    </div>
  );
};

export default ProductTypePage;
