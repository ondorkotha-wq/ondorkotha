import PaymentFailedComp from "@/component/Payment/PaymentFailedComp";
import { Suspense } from "react";

const PaymentFailedPage = () => {
  return (
    <Suspense>
      <PaymentFailedComp />
    </Suspense>
  );
};

export default PaymentFailedPage;
