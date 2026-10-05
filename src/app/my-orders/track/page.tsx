import TrackOrder from "@/component/Customer/Order/OrderTracking";

// Tracking view for a guest order placed on this browser
const GuestOrderTrackingPage = () => {
  return (
    <div>
      <TrackOrder guest />
    </div>
  );
};

export default GuestOrderTrackingPage;
