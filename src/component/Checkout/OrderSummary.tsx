/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import toast from "react-hot-toast";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import TakaIcon from "../TakaIcon";
import { isAuthenticated } from "@/utils/auth";
import { getVisitorId } from "@/utils/visitor";
import { CartItem } from "@/types/product.types";
import { useAuth } from "@/context/AuthContext";
import { GUEST_CHECKOUT_ENABLED } from "@/config/features";

interface OrderSummaryProps {
  cartId: number | null;
  subtotal: number;
  total: number;
  cartItems?: CartItem[];
  surcharge?: number;
  refetch: () => void;
  coupon?: string;
  couponError?: string | null;
  discountAmount?: number;
  deliveryFee?: number;
  deliveryFeeLoading?: boolean;
  freeDelivery?: boolean;
  isAddressGiven?: boolean;
  handleConfirmOrder?: () => void;
  paymentMethod?: string;
}

const OrderSummary = ({
  cartId,
  subtotal,
  total,
  cartItems,
  surcharge,
  refetch,
  coupon,
  couponError,
  discountAmount = 0,
  deliveryFee,
  deliveryFeeLoading = false,
  freeDelivery = false,
  isAddressGiven = false,
  handleConfirmOrder,
  paymentMethod,
}: OrderSummaryProps) => {
  const param = usePathname();
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const [code, setCode] = useState(coupon ?? "");
  const [removingCoupon, setRemovingCoupon] = useState(false);
  const isCheckoutPage = param?.includes("/checkout");

  // From the auth context rather than localStorage, so the server render and
  // the first client render agree. While auth is still loading, show neither
  // the guest options nor the promo box.
  const { token, loading: authLoading } = useAuth();
  const isSignedIn = !authLoading && !!token;
  const isGuest = !authLoading && !token;
  const offerGuestCheckout = isGuest && GUEST_CHECKOUT_ENABLED;

  // console.log(cartItems,'cartItems');

  // handle apply coupon — the persisted discount always comes back down via
  // the `discountAmount` prop once refetch() resolves (it's recomputed
  // server-side from the cart, never cached client-side), so this handler
  // only needs to trigger that refetch and give immediate toast feedback.
  const handleApplyCoupon = async () => {
    if (!code?.trim()) return toast.error("Please enter a coupon code");

    try {
      const res = await axiosSecure.patch(`/cart/apply-coupon/${cartId}`, {
        code,
      });
      const data = await res.data;

      refetch();

      toast.success(
        `Coupon ${data.coupon.code} applied! Discount: ${data.discountAmount}`,
      );
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to apply coupon");
    }
  };

  const handleRemoveCoupon = async () => {
    if (!cartId) return;
    try {
      setRemovingCoupon(true);
      if (isAuthenticated()) {
        await axiosSecure.delete(`/cart/coupon/${cartId}`);
      } else {
        const visitorId = await getVisitorId();
        await axiosSecure.delete(`/guest/cart/coupon/${cartId}`, {
          params: { visitorId },
        });
      }
      setCode("");
      refetch();
      toast.success("Coupon removed");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to remove coupon");
    } finally {
      setRemovingCoupon(false);
    }
  };

  // handle checkout
  const handleCheckout = () => {
    if (isAuthenticated()) {
      router.push(`/checkout/shipping-address`);
    } else {
      router.push("/login?redirect=/cart");
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-lg">Order Summary</h2>
      </div>
      <div className="bg-gray-50 p-6 sticky top-8 border border-gray-200">
        {/* Show cart items on checkout page */}
        {isCheckoutPage && cartItems && cartItems.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-4">
              Items ({cartItems.length})
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {cartItems &&
                cartItems.map((item: any) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={
                        item?.productSize?.color?.product?.images?.[0]?.image ||
                        ""
                      }
                      alt={
                        item?.productSize?.color?.product?.title || "Product"
                      }
                      className="w-16 h-20 object-cover bg-gray-100"
                      onError={(e) =>
                        (e.currentTarget.src =
                          "/images/placeholder.svg")
                      }
                    />
                    <div className="flex-1 text-xs space-y-1">
                      <p className="font-medium line-clamp-2">
                        {item?.productSize?.color?.product?.title}
                      </p>
                      <p className="text-gray-600">
                        {item.color} / {item.size}
                      </p>
                      <p className="text-gray-600">Qty: {item.quantity}</p>
                      <p className="font-medium flex items-center gap-1">
                        <TakaIcon />{" "}
                        {Number(item.subtotalAtAdd).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* subtotal  */}
        <div className="space-y-3 text-sm border-b border-gray-200 pb-4 mb-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="flex items-center gap-1">
              <TakaIcon /> {subtotal.toLocaleString()}
            </span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span className="flex items-center gap-1">
                − <TakaIcon /> {discountAmount.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-gray-500">
              {freeDelivery ? (
                <span className="text-green-600">Free</span>
              ) : deliveryFeeLoading ? (
                <span className="italic">Calculating…</span>
              ) : deliveryFee ? (
                <span className="">
                  <TakaIcon /> {deliveryFee}
                </span>
              ) : (
                <span className="italic">TBD</span>
              )}
            </span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2">
            <span>Total</span>
            <span className="flex items-center gap-1">
              <TakaIcon /> {total}
            </span>
          </div>
        </div>

        {/* action button */}
        {!isCheckoutPage ? (
          offerGuestCheckout ? (
            // Guests choose: check out without an account (COD only), or log
            // in first (online payment, coupons, order history everywhere)
            <div className="space-y-2 mb-3">
              <button
                onClick={() => router.push(`/checkout/shipping-address`)}
                disabled={!cartId}
                className="w-full bg-[#4a5568] text-white py-3 uppercase tracking-widest text-xs font-bold hover:bg-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Checkout as Guest
              </button>
              <button
                onClick={() => router.push("/login?redirect=/cart")}
                className="w-full border border-[#4a5568] text-[#4a5568] py-3 uppercase tracking-widest text-xs font-bold hover:bg-black hover:text-white hover:border-black transition cursor-pointer"
              >
                Log in to Checkout
              </button>
              <p className="text-xs text-gray-500 text-center">
                Guest orders are Cash on Delivery only.
              </p>
            </div>
          ) : (
            <button
              onClick={handleCheckout}
              className="w-full bg-[#4a5568] text-white py-3 uppercase tracking-widest text-xs font-bold hover:bg-black transition mb-3 cursor-pointer"
            >
              Proceed to Checkout
            </button>
          )
        ) : (
          <div>
            <button
              onClick={handleConfirmOrder}
              disabled={!isAddressGiven}
              className="w-full bg-[#4a5568] text-white py-3 uppercase tracking-widest text-xs font-bold hover:bg-black transition mb-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paymentMethod === "online"
                ? "Continue to Payment"
                : paymentMethod === "cod" && "Place Order"}
            </button>
            {paymentMethod === "online" && (
              <p className="text-xs text-gray-500 text-center">
                You’ll be redirected to our secure payment partner
              </p>
            )}
          </div>
        )}

        {/* promo code — account-only; guests get a log-in link instead (the
            backend rejects guest coupons with COUPON_REQUIRES_LOGIN) */}
        {isGuest && (
          <div className="mt-6 border-t border-gray-200 pt-4 text-sm">
            {coupon && (
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="text-amber-600">
                  Coupon &quot;{coupon}&quot; needs an account and won&apos;t be
                  applied.
                </p>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  disabled={removingCoupon}
                  className="shrink-0 text-xs underline text-gray-600 hover:text-black disabled:opacity-50 cursor-pointer"
                >
                  {removingCoupon ? "Removing…" : "Remove"}
                </button>
              </div>
            )}
            <p className="text-gray-600">
              Have a promo code?{" "}
              <Link
                href={`/login?redirect=${isCheckoutPage ? "/checkout/shipping-address" : "/cart"}`}
                className="underline hover:text-black"
              >
                Log in to use it
              </Link>
            </p>
          </div>
        )}
        {isSignedIn && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <details className="cursor-pointer group" open={!!coupon}>
              <summary className="text-sm font-medium flex justify-between items-center list-none outline-none">
                Promo Code{" "}
                <span className="group-open:rotate-45 transition-transform text-lg">
                  +
                </span>
              </summary>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  className="border border-gray-200 flex-1 p-2 text-sm outline-none"
                  placeholder="Enter code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  onClick={handleApplyCoupon}
                  className="border border-gray-200 px-4 py-2 text-xs uppercase font-bold hover:bg-black hover:text-white"
                >
                  Apply
                </button>
              </div>
              {coupon && (
                <div className="mt-2 flex items-start justify-between gap-3 text-sm">
                  {couponError ? (
                    <p className="text-amber-600">
                      Coupon &quot;{coupon}&quot; can&apos;t be used: {couponError}
                    </p>
                  ) : (
                    <p className="text-green-600">
                      Coupon &quot;{coupon}&quot; applied!{" "}
                      {freeDelivery && discountAmount <= 0 ? (
                        "Free delivery"
                      ) : (
                        <>
                          Discount: <TakaIcon /> {discountAmount.toLocaleString()}
                        </>
                      )}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    disabled={removingCoupon}
                    className="shrink-0 text-xs underline text-gray-600 hover:text-black disabled:opacity-50 cursor-pointer"
                  >
                    {removingCoupon ? "Removing…" : "Remove"}
                  </button>
                </div>
              )}
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;
