import CourierManagement from "@/component/Courier/CourierManagement";
import { Suspense } from "react";

const CourierPage = () => {
  return (
    <Suspense>
      <CourierManagement />
    </Suspense>
  );
};

export default CourierPage;
