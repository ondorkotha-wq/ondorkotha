import CheckoutSuccessPage from "@/component/Checkout/CheckoutSuccessComp";
import { Suspense } from "react";

const CheckoutSuccess = () => {
  return (
    <div>
      <Suspense>
        <CheckoutSuccessPage />
      </Suspense>
    </div>
  );
};

export default CheckoutSuccess;
