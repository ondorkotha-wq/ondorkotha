/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
"use client";

import useFetchCarts from "@/hooks/Cart/useCarts";
import Title from "../Headers/Title";
import TakaIcon from "../TakaIcon";
import OrderSummary from "./OrderSummary";
import { useAuth } from "@/context/AuthContext";
import useFetchDistricts from "@/hooks/Districts/useFetchDistricts";
import LoadingDots from "../Loading/LoadingDS";
import { useEffect, useState } from "react";
import Link from "next/link";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FullScreenCenter } from "../Screen/FullScreenCenter";
import useFetchZones from "@/hooks/Districts/useFetchZones";
import useFetchAreaList from "@/hooks/Districts/useFetchAreaList";
import { pushGTMEvent } from "@/lib/gtm";
import { buildUserData } from "@/lib/hash";
import { useQueryClient } from "@tanstack/react-query";
import { cartOwnerParams } from "@/utils/visitor";
import { GUEST_CHECKOUT_ENABLED } from "@/config/features";

// Controlled via NEXT_PUBLIC_SSLCOMMERZ_ENABLED — set to "true" in .env to
// bring back the "Pay Now" option once the gateway is live again.
const SSLCOMMERZ_ENABLED = process.env.NEXT_PUBLIC_SSLCOMMERZ_ENABLED === "true";

const CheckoutPageComponent = () => {
  const { user, loading } = useAuth();
  // Guest checkout: COD only, phone always verified by OTP, no coupons
  const isGuest = !loading && !user;
  const queryClient = useQueryClient();
  // Set when the server says this order needs an account (advance deposit)
  const [loginPrompt, setLoginPrompt] = useState<string | null>(null);

  const [selectedZone, setSelectedZone] = useState<number | "">("");
  const [selectedArea, setSelectedArea] = useState<number | "">("");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  // "ready" only once the server has quoted a fee for the selected zone —
  // placing an order is blocked until then so the shown fee is the charged fee.
  const [deliveryFeeStatus, setDeliveryFeeStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [showModal, setShowModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const axiosSecure = useAxiosSecure();
  const router = useRouter();

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    districtId: 0,
    zoneId: 0,
    areaId: 0,
    zoneName: "",
    areaName: "",
    fullAddress: "",
    postCode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");

  const {
    districts,
    isLoading: isDistrictLoading,
    error,
  } = useFetchDistricts();

  const {
    cart,
    isLoading: isCartLoading,
    isFetching,
    refetch,
  } = useFetchCarts({ isSummary: true });

  const subtotal = Number(cart?.subtotalAtAdd ?? 0);
  const discountAmount = Number(cart?.discountAmount ?? 0);
  const freeDelivery = !!cart?.freeDelivery;
  const handlingSurcharge = 0;

  const effectiveDeliveryFee = freeDelivery ? 0 : deliveryFee;
  const total = subtotal - discountAmount + effectiveDeliveryFee;

  const selectedDistrict = districts?.find((d) => d.id === address.districtId);

  const districtBlocksCOD = selectedDistrict?.isCODAvailable === false;

  const finalCODAvailable = cart?.codAvailable && !districtBlocksCOD;

  const { zones, isLoading: isZoneLoading } = useFetchZones({
    id: selectedDistrict?.id,
    enabled: !!selectedDistrict,
  });

  // console.log(zones, "zones");

  const { areas, isLoading: isAreaLoading } = useFetchAreaList({
    id: selectedZone ? Number(selectedZone) : undefined,
    enabled: !!selectedZone,
  });

  // console.log(cart, "cart-response");

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Update useEffect to set user info
  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        name: user.name || "",
        phone: user.phone?.replace("+880", "") || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    setSelectedZone("");
    setSelectedArea("");
    setAddress((prev) => ({
      ...prev,
      zoneId: 0,
      areaId: 0,
      zoneName: "",
      areaName: "",
    }));
  }, [address.districtId]);

  useEffect(() => {
    setSelectedArea("");
    setAddress((prev) => ({ ...prev, areaId: 0, areaName: "" }));
  }, [selectedZone]);

  const buildCartItems = () =>
    (cart?.items ?? []).map((item) => {
      const product = item.productSize?.color?.product;
      const createdAt = product?.createdAt;
      const isNew = createdAt
        ? Date.now() - new Date(createdAt).getTime() < 60 * 24 * 60 * 60 * 1000
        : false;
      const basePrice = Number(item.productSize?.basePrice ?? 0);
      const salePrice = Number(item.priceAtAdd ?? 0);
      const isOnSale = basePrice - salePrice >= 1;
      const totalStock =
        product?.colors?.reduce(
          (acc: number, c: any) =>
            acc +
            (c.sizes?.reduce((a: number, s: any) => a + (s.quantity ?? 0), 0) ??
              0),
          0,
        ) ?? 0;

      return {
        item_id: product?.id?.toString() || "",
        item_name: product?.title || "",
        price: salePrice,
        item_category:
          product?.subCategories?.[0]?.subCategory?.category?.name || "",
        item_subCategory: product?.subCategories?.[0]?.subCategory?.name || "",
        item_series:
          product?.subCategories?.[0]?.subCategory?.category?.series?.name ||
          "",
        item_color: item.productSize?.color?.color?.name || "",
        item_size: item.productSize?.size?.name || "",
        item_material: product?.material?.name || "",
        item_variant: [
          item.productSize?.color?.color?.name,
          item.productSize?.size?.name,
          product?.material?.name,
        ]
          .filter(Boolean)
          .join(" / "),
        is_new: isNew,
        is_on_sale: isOnSale,
        discount: Math.max(0, basePrice - salePrice),
        availability:
          totalStock > 0 ? ("instock" as const) : ("outofstock" as const),
      };
    });

  // google tag manager - begin_checkout event
  useEffect(() => {
    if (!cart || isCartLoading) return;

    const fire = async () => {
      const userData = await buildUserData({
        email: user?.email,
        phone: user?.phone,
        name: user?.name,
        city: selectedDistrict?.name,
      });

      pushGTMEvent({
        event: "begin_checkout",
        value: subtotal + deliveryFee,
        currency: "BDT",
        items: buildCartItems(),
        user_data: userData,
      });
    };

    fire();
  }, [cart?.id]);

  // Delivery fee depends only on district + zone + cart weight (the server
  // reads the weight from the cart itself), and is the same quote the order
  // will be charged with.
  useEffect(() => {
    if (!selectedZone || !address.districtId || !cart?.id) {
      setDeliveryFee(0);
      setDeliveryFeeStatus("idle");
      return;
    }

    let cancelled = false;
    setDeliveryFeeStatus("loading");

    const timeout = setTimeout(async () => {
      try {
        // guests identify their cart by visitorId; signed-in users by token
        const owner = await cartOwnerParams();
        const res = await axiosSecure.post("/delivery/fee", {
          cityId: address.districtId,
          zoneId: selectedZone,
          cartId: cart.id,
          ...owner,
        });
        if (cancelled) return;
        setDeliveryFee(Number(res.data.fee));
        setDeliveryFeeStatus("ready");
      } catch {
        if (cancelled) return;
        setDeliveryFee(0);
        setDeliveryFeeStatus("error");
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [address.districtId, axiosSecure, cart?.id, cart?.items, selectedZone]);

  // Online payment is account-only, so guests stay on COD (and are blocked
  // from ordering when COD isn't available, see the payment section)
  useEffect(() => {
    if (
      SSLCOMMERZ_ENABLED &&
      !isGuest &&
      !finalCODAvailable &&
      paymentMethod === "cod"
    ) {
      setPaymentMethod("online");
    }
    if (isGuest && paymentMethod === "online") setPaymentMethod("cod");
  }, [finalCODAvailable, paymentMethod, isGuest]);

  // Reset OTP state whenever the phone number changes
  useEffect(() => {
    setOtpRequired(false);
    setOtpValue("");
  }, [address.phone]);

  // Resend countdown ticker
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  // Full-screen loader only until auth and the first cart are known.
  // Refetches (coupon removed, price corrected…) keep the form on screen.
  if (loading || (!cart && (isCartLoading || isFetching))) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  // Not signed in and guest checkout is switched off: account required
  if (!user && !GUEST_CHECKOUT_ENABLED) {
    return (
      <div className="max-w-[1500px] mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <h2 className="text-2xl font-semibold">
            Please sign in to continue checkout
          </h2>
          <p className="text-sm text-gray-600">
            Checkout is available for registered customers only.
          </p>
          <Link
            href={`/login?redirect=cart`}
            className="border border-black px-8 py-3 uppercase text-xs font-bold hover:bg-black hover:text-white transition-all duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleConfirmOrder = () => {
    setShowModal(true);
  };

  const buildOrderPayload = (withOtp?: string) => ({
    cartId: cart!.id,
    address,
    // guests are COD-only (the backend rejects anything else)
    paymentMethod: !isGuest && paymentMethod === "online" ? "ONLINE" : "COD",
    expectedDeliveryFee: deliveryFee,
    ...(withOtp ? { otp: withOtp } : {}),
  });

  // Signed-in orders go to /orders/create; guest orders to the guest route,
  // which identifies the cart owner by visitorId (a UUID)
  const postOrder = async (payload: ReturnType<typeof buildOrderPayload>) => {
    if (!isGuest) return axiosSecure.post(`/orders/create`, payload);
    const { visitorId } = await cartOwnerParams();
    return axiosSecure.post(`/guest/orders/create`, payload, {
      params: { visitorId },
    });
  };

  const resetOtpStep = () => {
    setOtpRequired(false);
    setOtpValue("");
  };

  const handlePlaceOrder = async () => {
    if (!cart?.id) { toast.error("Cart not found"); return; }
    if (!selectedZone) { toast.error("Please select zone"); return; }
    if (deliveryFeeStatus !== "ready") {
      toast.error("Delivery charge is still being calculated");
      return;
    }
    if (isGuest && !finalCODAvailable) {
      toast.error("Cash on Delivery isn't available for this order");
      return;
    }

    // If OTP step is active, require a 6-digit code before submitting
    if (otpRequired && otpValue.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    try {
      setPlacingOrder(true);

      const userData = await buildUserData({
        email: user?.email,
        phone: address.phone,
        name: address.name,
        city: selectedDistrict?.name,
      });

      const { data } = await postOrder(
        buildOrderPayload(otpRequired ? otpValue : undefined),
      );

      // Sent for every guest order, and for signed-in users ordering to a
      // phone other than their account phone. Within a minute of the last
      // code the server doesn't send another SMS — its message says so.
      if (data?.status === "OTP_REQUIRED") {
        setOtpRequired(true);
        setOtpValue("");
        setResendCountdown(60);
        toast(data?.message || "OTP sent to +880" + address.phone);
        return;
      }

      const orderId = data?.orderId;
      if (!orderId) { toast.error("Order creation failed"); return; }

      // the cart is checked out server-side; refresh it and the header count
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cartCount"] });

      toast.success("Order placed successfully!");
      pushGTMEvent({
        event: "purchase",
        transaction_id: String(orderId),
        value: subtotal + deliveryFee,
        currency: "BDT",
        items: buildCartItems(),
        user_data: userData,
      });

      if (data?.advanceRequired) {
        toast(
          `This item requires a ${data.advancePercentage}% deposit. Pay ${data.advanceAmount} now, remaining ${data.remainingAmount} due on delivery.`,
          { duration: 8000 },
        );
        router.push(`/checkout/payment?orderId=${orderId}`);
      } else if (paymentMethod === "cod") {
        router.replace(`/checkout/success?orderId=${orderId}`);
      } else {
        router.push(`/checkout/payment?orderId=${orderId}`);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const errData = error?.response?.data;
      toast.error(errData?.message || "Order failed");

      // The server only marks the code used when the order is actually
      // created, so after a rejection below the code entered is still valid
      // and the OTP step is kept — the customer just confirms again.

      if (errData?.code === "DELIVERY_FEE_CHANGED") {
        // Show the updated charge; the customer places the order again
        setDeliveryFee(Number(errData.deliveryFee));
        setShowModal(false);
        return;
      }

      if (errData?.code === "GUEST_ADVANCE_PAYMENT_REQUIRES_LOGIN") {
        // Needs an online deposit, which is account-only
        setLoginPrompt(errData.message);
        setShowModal(false);
        resetOtpStep();
        return;
      }

      if (status === 429) {
        // Hourly SMS limit for this phone (OTP_LIMIT)
        setShowModal(false);
        resetOtpStep();
        return;
      }

      // Wrong/expired code: keep the modal open so the customer can retry
      // or resend
      if (otpRequired && /invalid or expired otp/i.test(errData?.message ?? ""))
        return;

      // Anything else (price changed, coupon removed, guest order limit…)
      // may have changed the cart server-side; reload it so the summary
      // shows what will actually be charged.
      refetch();
      setShowModal(false);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setOtpValue("");
    setPlacingOrder(true);
    try {
      const { data } = await postOrder(buildOrderPayload());
      setResendCountdown(60);
      toast(data?.message || "New OTP sent to +880" + address.phone);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="max-w-375 mx-auto px-4 py-8 lg:px-8 lg:py-12 font-sans">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16">
        {/* LEFT: Shipping Form */}
        <div className="flex-1 space-y-8">
          <Title title="Shipping Address" />

          {loginPrompt && (
            <div className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex flex-wrap items-center justify-between gap-3">
              <span>{loginPrompt}</span>
              <Link
                href="/login?redirect=/checkout/shipping-address"
                className="border border-amber-800 px-4 py-2 text-xs font-bold uppercase hover:bg-amber-800 hover:text-white transition-colors"
              >
                Log in
              </Link>
            </div>
          )}

          {isGuest && !loginPrompt && (
            <p className="text-sm text-gray-600 border border-gray-200 bg-gray-50 px-4 py-3">
              Checking out as a guest — Cash on Delivery only. We&apos;ll text
              a code to verify your phone.{" "}
              <Link
                href="/login?redirect=/checkout/shipping-address"
                className="underline hover:text-black"
              >
                Log in instead
              </Link>
            </p>
          )}

          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wide block mb-3">
                Full Name*
              </label>
              <input
                type="text"
                value={address.name}
                onChange={(e) =>
                  setAddress((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-gray-900 transition-colors"
                placeholder="Your full name"
              />
            </div>

            {/* District */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wide block mb-3">
                District*
              </label>
              <select
                value={address.districtId}
                className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-gray-900 transition-colors bg-white"
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const district = districts?.find((d) => d.id === id);

                  setAddress((prev) => ({
                    ...prev,
                    districtId: id,
                  }));

                  // auto-switch to online if COD not allowed (not for
                  // guests: online payment needs an account)
                  if (
                    SSLCOMMERZ_ENABLED &&
                    !isGuest &&
                    district &&
                    !finalCODAvailable
                  ) {
                    setPaymentMethod("online");
                  }
                }}
              >
                <option value="">Select District</option>
                {districts?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone - only show if district selected */}
            {!!address.districtId && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wide block mb-3">
                  Zone*
                </label>
                {isZoneLoading ? (
                  <LoadingDots />
                ) : (
                  <select
                    value={selectedZone}
                    onChange={(e) => {
                      const selected = zones?.find(
                        (z) => z.id === Number(e.target.value),
                      );
                      setSelectedZone(Number(e.target.value));
                      setAddress((prev) => ({
                        ...prev,
                        zoneId: Number(e.target.value),
                        zoneName: selected?.name ?? "",
                        areaId: 0,
                        areaName: "",
                      }));
                    }}
                    className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-gray-900 transition-colors bg-white"
                  >
                    <option value="">Select Zone</option>
                    {zones?.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Area - only show if zone selected */}
            {selectedZone && !isAreaLoading && areas && areas.length > 0 && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wide block mb-3">
                  Area*
                </label>
                {isAreaLoading ? (
                  <LoadingDots />
                ) : (
                  <select
                    value={selectedArea}
                    onChange={(e) => {
                      const selected = areas?.find(
                        (a) => a.id === Number(e.target.value),
                      );
                      setSelectedArea(Number(e.target.value));
                      setAddress((prev) => ({
                        ...prev,
                        areaId: Number(e.target.value),
                        areaName: selected?.name ?? "",
                      }));
                    }}
                    className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-gray-900 transition-colors bg-white"
                  >
                    <option value="">Select Area</option>
                    {areas?.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Full Address */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wide block mb-3">
                Full Address*
              </label>
              <textarea
                rows={4}
                value={address.fullAddress}
                onChange={(e) =>
                  setAddress((prev) => ({
                    ...prev,
                    fullAddress: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-gray-900 transition-colors resize-none"
                placeholder="House, Road, Area"
              />
            </div>

            {/* Postcode */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wide block mb-3">
                Postcode <span className="font-normal normal-case text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4,6}" // 4–6 digits
                value={address.postCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ""); // numbers only
                  if (value.length > 6) return; // max 6 digits
                  setAddress((prev) => ({ ...prev, postCode: value }));
                }}
                className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-gray-900 transition-colors"
                placeholder="Enter postcode"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wide block mb-3">
                Phone Number*
              </label>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 px-4 py-3 border border-gray-300 bg-gray-50">
                  +880
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[1-9][0-9]{9}"
                  value={address.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.startsWith("0") || value.length > 10) return;
                    setAddress((prev) => ({ ...prev, phone: value }));
                  }}
                  className="flex-1 border border-gray-300 px-4 py-3 outline-none focus:border-gray-900 transition-colors"
                  placeholder="1XXXXXXXXX"
                />
              </div>
            </div>

            {/* payment method */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-bold uppercase tracking-wide">
                Payment Method
              </h4>

              {/* Cash on Delivery */}
              <label
                className={`flex items-center gap-3 cursor-pointer ${
                  !finalCODAvailable ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  disabled={!finalCODAvailable}
                  onChange={() => setPaymentMethod("cod")}
                />
                <span className="text-sm">
                  Cash on Delivery
                  {!finalCODAvailable && (
                    <span className="block text-xs text-red-500">
                      {cart?.codMessage
                        ? cart.codMessage
                        : "Not available in this district"}
                      {/* only when online payment exists to log in for */}
                      {isGuest && SSLCOMMERZ_ENABLED && (
                        <>
                          {" "}
                          — guest orders are Cash on Delivery only.{" "}
                          <Link
                            href="/login?redirect=/checkout/shipping-address"
                            className="underline"
                          >
                            Log in
                          </Link>{" "}
                          to pay online.
                        </>
                      )}
                    </span>
                  )}
                </span>
              </label>

              {/* Pay Now — account-only */}
              {SSLCOMMERZ_ENABLED && !isGuest && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                  />
                  <span className="text-sm">Pay Now</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Order Summary */}
        {cart && (
          <aside className="w-full lg:w-100 xl:w-110 shrink-0">
            <OrderSummary
              cartId={cart?.id}
              subtotal={subtotal}
              total={total}
              cartItems={cart?.items ?? []}
              surcharge={handlingSurcharge}
              refetch={refetch}
              coupon={cart.coupon?.code}
              couponError={cart.couponError}
              deliveryFee={deliveryFee}
              deliveryFeeLoading={deliveryFeeStatus === "loading"}
              freeDelivery={freeDelivery}
              discountAmount={discountAmount}
              isAddressGiven={
                !!(
                  address.name &&
                  address.phone &&
                  address.districtId &&
                  selectedZone &&
                  address.fullAddress &&
                  deliveryFeeStatus === "ready" &&
                  // the server rejects orders with an ineligible coupon —
                  // the summary shows why and offers to remove it
                  !cart.couponError &&
                  // guests can only pay by COD
                  (!isGuest || !!finalCODAvailable)
                )
              }
              handleConfirmOrder={handleConfirmOrder}
              paymentMethod={paymentMethod}
            />
          </aside>
        )}
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-100 max-w-full p-6 space-y-4">
            {otpRequired ? (
              /* ── OTP verification step ── */
              <>
                <h3 className="text-lg font-bold">Verify Phone Number</h3>
                <p className="text-sm text-gray-600">
                  A 6-digit OTP was sent to{" "}
                  <span className="font-medium">+880{address.phone}</span>.
                  Enter it below to place your order.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) =>
                    setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="______"
                  className="w-full border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-gray-900 transition-colors"
                />
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Didn&apos;t receive it?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCountdown > 0 || placingOrder}
                    className="text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {resendCountdown > 0
                      ? `Resend in ${resendCountdown}s`
                      : "Resend OTP"}
                  </button>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setOtpRequired(false);
                      setOtpValue("");
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder || otpValue.length !== 6}
                    className="px-4 py-2 bg-[#4a5568] text-white rounded-lg text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {placingOrder ? "Verifying..." : "Verify & Place Order"}
                  </button>
                </div>
              </>
            ) : (
              /* ── Normal order confirmation step ── */
              <>
                <h3 className="text-lg font-bold">Confirm Your Order</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Name:</span> {address.name}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> +880
                    {address.phone}
                  </p>
                  <p>
                    <span className="font-medium">Address:</span>{" "}
                    {address.fullAddress}
                  </p>
                  <p>
                    <span className="font-medium">Subtotal:</span> <TakaIcon />{" "}
                    {subtotal.toLocaleString()}
                  </p>
                  {discountAmount > 0 && (
                    <p>
                      <span className="font-medium">Discount:</span> −{" "}
                      <TakaIcon /> {discountAmount.toLocaleString()}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Shipping:</span>{" "}
                    {freeDelivery ? (
                      "Free"
                    ) : (
                      <>
                        <TakaIcon /> {deliveryFee}
                      </>
                    )}
                  </p>
                  <p className="font-bold">
                    <span className="font-medium">Total:</span> <TakaIcon />{" "}
                    {total}
                  </p>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className="px-4 py-2 bg-[#4a5568] text-white rounded-lg text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {placingOrder
                      ? "Placing..."
                      : paymentMethod === "cod"
                        ? "Place Order"
                        : "Proceed to payment"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

type StepTypeProps = {
  label: string;
  active: boolean;
};

const Step = ({ label, active }: StepTypeProps) => (
  <div className="flex flex-col items-center relative">
    <div
      className={`w-5 h-5 rounded-full border-2 transition-all ${
        active
          ? "bg-slate-700 border-slate-700 shadow-sm"
          : "bg-white border-gray-300"
      } z-10`}
    ></div>
    <span
      className={`text-[11px] uppercase mt-3 whitespace-nowrap tracking-wider ${
        active ? "text-black font-bold" : "text-gray-400 font-medium"
      }`}
    >
      {label}
    </span>
  </div>
);

export default CheckoutPageComponent;
