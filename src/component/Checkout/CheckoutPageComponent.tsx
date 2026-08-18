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

// Controlled via NEXT_PUBLIC_SSLCOMMERZ_ENABLED — set to "true" in .env to
// bring back the "Pay Now" option once the gateway is live again.
const SSLCOMMERZ_ENABLED = process.env.NEXT_PUBLIC_SSLCOMMERZ_ENABLED === "true";

const CheckoutPageComponent = () => {
  const { user, loading } = useAuth();

  const [selectedZone, setSelectedZone] = useState<number | "">("");
  const [selectedArea, setSelectedArea] = useState<number | "">("");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
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

  useEffect(() => {
    if (!selectedZone || !address.districtId || !cart?.id) return;

    const totalWeight =
      cart?.items?.reduce((acc, item) => {
        console.log(item.productSize?.color?.product?.weight, acc);
        const weight = item.productSize?.color?.product?.weight || 0;
        return acc + weight * item.quantity;
      }, 0) || 0;

    console.log(totalWeight);

    if (totalWeight <= 0) return;

    const timeout = setTimeout(() => {
      axiosSecure
        .post("/delivery/fee", {
          cityId: address.districtId,
          zoneId: selectedZone,
          areaId: selectedArea || undefined,
          cartId: cart.id,
          weight: totalWeight,
        })

        .then((res) => {
          console.log(res.data, "delivery fee data");
          setDeliveryFee(res.data.fee);
        })
        .catch(() => {
          setDeliveryFee(0);
        });
    }, 400);

    return () => clearTimeout(timeout);
  }, [
    address.districtId,
    axiosSecure,
    cart?.id,
    cart?.items,
    selectedArea,
    selectedZone,
  ]);

  useEffect(() => {
    if (SSLCOMMERZ_ENABLED && !finalCODAvailable && paymentMethod === "cod") {
      setPaymentMethod("online");
    }
  }, [finalCODAvailable, paymentMethod]);

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

  // loading state
  if (loading || isCartLoading || isFetching) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  // user not available
  if (!loading && !user) {
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
    paymentMethod: paymentMethod === "cod" ? "COD" : "ONLINE",
    ...(withOtp ? { otp: withOtp } : {}),
  });

  const handlePlaceOrder = async () => {
    if (!cart?.id) { toast.error("Cart not found"); return; }
    if (!selectedZone) { toast.error("Please select zone"); return; }

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

      const { data } = await axiosSecure.post(
        `/orders/create`,
        buildOrderPayload(otpRequired ? otpValue : undefined),
      );

      // Backend returns this shape when phone differs and no OTP was sent yet
      if (data?.status === "OTP_REQUIRED") {
        setOtpRequired(true);
        setOtpValue("");
        setResendCountdown(60);
        toast("OTP sent to +880" + address.phone);
        return;
      }

      const orderId = data?.orderId;
      if (!orderId) { toast.error("Order creation failed"); return; }

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
      toast.error(error?.response?.data?.message || "Order failed");
      // Keep modal open on OTP failure so user can retry
      if (!otpRequired) setShowModal(false);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setOtpValue("");
    setPlacingOrder(true);
    try {
      await axiosSecure.post(`/orders/create`, buildOrderPayload());
      setResendCountdown(60);
      toast("New OTP sent to +880" + address.phone);
    } catch {
      toast.error("Failed to resend OTP");
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

                  setDeliveryFee(district?.deliveryFee ?? 0);

                  // auto-switch to online if COD not allowed
                  if (SSLCOMMERZ_ENABLED && district && !finalCODAvailable) {
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
            {address.districtId && (
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
                    </span>
                  )}
                </span>
              </label>

              {/* Pay Now */}
              {SSLCOMMERZ_ENABLED && (
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
              deliveryFee={deliveryFee}
              freeDelivery={freeDelivery}
              discountAmount={discountAmount}
              isAddressGiven={
                !!(
                  address.name &&
                  address.phone &&
                  address.districtId &&
                  selectedZone &&
                  address.fullAddress &&
                  address.postCode
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
                  <p>
                    <span className="font-medium">Shipping:</span>{" "}
                    {deliveryFee ? <TakaIcon /> : ""} {deliveryFee ?? "TBD"}
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
