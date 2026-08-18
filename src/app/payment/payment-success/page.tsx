import PaymentSuccessComp from "@/component/Payment/PaymentSuccessComp";
import { Suspense } from "react";

const PaymentSuccessPage = () => {
  return (
    <Suspense>
      <PaymentSuccessComp />
    </Suspense>
  );
};

export default PaymentSuccessPage;
