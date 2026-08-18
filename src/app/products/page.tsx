import AllProductsComp from "@/component/Product/AllProductsComp";
import { Suspense } from "react";

const AllProducts = () => {
  return (
    <div>
      <Suspense>
        <AllProductsComp />
      </Suspense>
    </div>
  );
};

export default AllProducts;
