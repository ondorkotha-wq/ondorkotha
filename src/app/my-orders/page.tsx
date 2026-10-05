import GuestOrders from "@/component/Customer/Order/GuestOrders";

// Guest "My Orders": orders placed without an account on this browser
const MyOrdersPage = () => {
  return (
    <div>
      <GuestOrders />
    </div>
  );
};

export default MyOrdersPage;
