import PaymentPageComponent from "@/component/Checkout/Payment";
import React, { Suspense } from "react";

const CheckPaymentPage = () => {
  return (
    <Suspense>
      <PaymentPageComponent></PaymentPageComponent>
    </Suspense>
  );
};

export default CheckPaymentPage;
