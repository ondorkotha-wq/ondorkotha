/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import useTrackOrder from "@/hooks/Track/useTrack";
import { useState } from "react";

const Track = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [orderId, setOrderId] = useState("");

  //   const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState("");

  const {
    order: orderData,
    isLoading,
    isError,

  } = useTrackOrder({ trackingId: orderId });

  console.log(orderData, "orderdataa");

  const handleTrack = (e: any) => {
    e.preventDefault();
    setError("");

    console.log(trackingNumber, "trackingNumber");

    setOrderId(trackingNumber);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-900">
      {/* Use a slightly tighter container for that boutique feel */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-16">
        {/* Tracking Form - Clean & Minimalist */}
        <div className="bg-white p-6 sm:p-10 md:p-12 rounded-sm shadow-sm mb-6 md:mb-10">
          <h2 className="text-xl md:text-2xl font-light mb-2 tracking-tight">
            Track Your Order
          </h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Enter your order number to view your journey.
          </p>

          <form
            onSubmit={handleTrack}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1">
              <input
                type="text"
                placeholder="Order Number (e.g., SK123456)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-0 py-3 text-sm border-b border-gray-200 focus:border-black focus:outline-none transition-all bg-transparent"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto bg-black text-white px-10 py-3 text-xs font-bold tracking-[0.2em] uppercase hover:bg-gray-800 transition active:scale-95"
            >
              Track
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 text-red-600 bg-red-50 text-xs tracking-wide">
              {error}
            </div>
          )}
        </div>

        {orderData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Order Summary Grid */}
            <div className="bg-white p-6 sm:p-8 rounded-sm shadow-sm mb-4 md:mb-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                <div className="col-span-2 md:col-span-1 border-b md:border-none pb-4 md:pb-0">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">
                    Order Number
                  </span>
                  <span className="text-base font-medium">
                    {orderData.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">
                    Order Date
                  </span>
                  <span className="text-sm">{orderData.orderDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">
                    Expected Delivery
                  </span>
                  <span className="text-sm font-medium text-teal-700">
                    {orderData.estimatedDelivery}
                  </span>
                </div>
              </div>
            </div>

            {/* Tracking History - Vertical Timeline */}
            <div className="bg-white p-6 sm:p-10 md:p-12 rounded-sm shadow-sm mb-4 md:mb-6">
              <h3 className="text-lg font-light mb-10 tracking-tight border-b border-gray-200 pb-4">
                Tracking History
              </h3>

              <div className="relative ml-2">
                {orderData.trackingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex gap-6 mb-10 last:mb-0 relative"
                  >
                    {/* Timeline logic */}
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`z-10 w-3 h-3 rounded-full mt-1.5 ${
                          event.completed
                            ? "bg-black"
                            : "bg-white border border-gray-300"
                        }`}
                      />
                      {index !== orderData.trackingEvents.length - 1 && (
                        <div
                          className={`absolute top-3 w-[1px] h-[calc(100%+2.5rem)] ${
                            event.completed ? "bg-black" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>

                    <div className="flex-1 group">
                      <div
                        className={`text-sm mb-1 tracking-wide ${
                          event.completed
                            ? "text-black font-medium"
                            : "text-gray-400"
                        }`}
                      >
                        {event.status}
                        {event.current && (
                          <span className="ml-3 text-[9px] bg-black text-white px-2 py-0.5 uppercase tracking-tighter">
                            Current
                          </span>
                        )}
                      </div>
                      {event.date && (
                        <div className="text-[11px] text-gray-500 tabular-nums">
                          {event.date}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items & Shipping Wrapper for Desktop Side-by-Side (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
              {/* Items Section */}
              <div className="md:col-span-3 bg-white p-6 sm:p-8 rounded-sm shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-6">
                  Your Items
                </h3>
                {orderData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 pb-4 mb-4 border-b border-gray-50 last:border-none last:mb-0"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-20 object-cover bg-gray-100"
                    />
                    <div className="flex flex-col justify-center">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Qty: {item.quantity}
                      </p>
                      {/* <p className="text-sm font-semibold mt-auto">
                        Tk {item.price}
                      </p> */}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address Section */}
              <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-sm shadow-sm">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Shipping To
                </h3>
                <div className="text-sm leading-relaxed text-gray-700">
                  <div className="font-semibold text-black mb-1">
                    {orderData.shippingAddress.name}
                  </div>
                  <div>{orderData.shippingAddress.phone}</div>
                  <div>{orderData.shippingAddress.address}</div>
                  <div>{orderData.shippingAddress.district}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Track;
