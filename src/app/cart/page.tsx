import CartPageComponent from "@/component/Checkout/CartPageComponent";
import FeaturedReview from "@/component/Reviews/FeaturedReview";
import React from "react";

const CartPage = () => {
  return (
    <div>
        {/* max-w-375 mx-auto p-4 lg:p-8 font-sans overflow-x-hidden */}
      <CartPageComponent></CartPageComponent>
      {/* Featured Review */}
      <div className="px-4 md:px-12 lg:px-40 pb-8">
        <FeaturedReview />
      </div>
    </div>
  );
};

export default CartPage;
