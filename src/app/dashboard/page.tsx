import CustomerDashboard from "@/component/Dashboard/CustomerDashboard";
import { Suspense } from "react";

const Dashboard = () => {
  return (
    <div>
      <Suspense>
        <CustomerDashboard />
      </Suspense>
    </div>
  );
};

export default Dashboard;
