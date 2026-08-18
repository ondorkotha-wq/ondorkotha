import PaymentCancelledComp from "@/component/Payment/PaymentCancelledComp";
import { Suspense } from "react";

const PaymentCancellationPage = () => {
  return (
    <Suspense>
      <PaymentCancelledComp />
    </Suspense>
  );
};

export default PaymentCancellationPage;
