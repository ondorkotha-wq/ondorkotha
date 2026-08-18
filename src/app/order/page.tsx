import OrderDetails from "@/component/Order/OrderDetails";
import { Suspense } from "react";

const OrderByIdPage = () => {
  return (
    <Suspense>
      <OrderDetails />
    </Suspense>
  );
};

export default OrderByIdPage;
