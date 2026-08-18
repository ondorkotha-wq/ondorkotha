/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @next/next/no-img-element */
"use client";

import { InfoIcon } from "lucide-react";
import Title from "../Headers/Title";
import TakaIcon from "../TakaIcon";
import ShowProductsFlex from "../ProductDisplay/ShowProductsFlex";
import useFetchCarts from "@/hooks/Cart/useCarts";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import Link from "next/link";
import OrderSummary from "./OrderSummary";
import useCartCount from "@/hooks/Cart/useCartCount";
import { useEffect, useMemo } from "react";
import useFetchRelatedProducts from "@/hooks/Products/RelatedProducts/useFetchRelatedProducts";
import LoadingDots from "../Loading/LoadingDS";
import { FullScreenCenter } from "../Screen/FullScreenCenter";
import { isAuthenticated } from "@/utils/auth";
import { getVisitorId } from "@/utils/visitor";
import { pushGTMEvent } from "@/lib/gtm";

const buildCartItem = (item: any) => {
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
        (c.sizes?.reduce((a: number, s: any) => a + (s.quantity ?? 0), 0) ?? 0),
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
      product?.subCategories?.[0]?.subCategory?.category?.series?.name || "",
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
};

const CartPageComponent = () => {
  const { cart, isLoading, isFetching, refetch } = useFetchCarts();

  const { refetch: refetchCount } = useCartCount();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const cartItems = useMemo(() => {
    return cart?.items ?? [];
  }, [cart?.items]);

  const cartItemIds = useMemo(() => {
    return Array.from(
      new Set(
        cartItems
          .map((item) => item.productSize?.color?.product.id)
          .filter((id): id is number => typeof id === "number"),
      ),
    );
  }, [cartItems]);

  const { relatedProducts, isLoading: isRelatedLoading } =
    useFetchRelatedProducts({
      productSlug: cartItems[0]?.productSize?.color?.product.slug,
      productIds: cartItemIds.join(","),
    });

  if (isLoading || isFetching) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  // console.log(cartItems,'cartitems');
  const subtotal = Number(cart?.subtotalAtAdd ?? 0);
  const discountAmount = Number(cart?.discountAmount ?? 0);

  const handlingSurcharge = 0;
  const total = subtotal - discountAmount + handlingSurcharge;

  return (
    <div className="max-w-375 mx-auto p-4 lg:p-8 font-sans overflow-x-hidden">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* LEFT: Items List */}
        <div className="flex-1 min-w-0">
          <div className="border mb-4 bg-gray-100">
            <div className="px-4 py-4">
              <p className="text-sm text-gray-600 flex gap-2 items-center">
                <InfoIcon size={16} /> The items in your bags may be on sale
                soon. Check it often and start shopping!
              </p>
            </div>
          </div>

          <Title title="Basket" />

          <header className="hidden md:flex border-b border-gray-200 py-2 text-xs uppercase tracking-wider text-gray-500">
            <div className="flex-2">Item</div>
            <div className="flex-1 text-center">Item Price</div>
            <div className="flex-1 text-center">Quantity</div>
            <div className="flex-1 text-right">Total Price</div>
          </header>

          {/* Map actual cart items */}
          {cartItems.length > 0 ? (
            cartItems.map((item: any) => (
              <CartItemComponent
                key={item.id}
                item={item}
                refetch={refetch}
                refetchCount={refetchCount}
              />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              Your cart is empty
            </div>
          )}

          {/* Favorites Section */}
          {cartItems && cartItems.length > 0 && (
            <div className="mt-16 max-w-full overflow-hidden">
              <Title title="You may also like" />
              <div className="w-full">
                <ShowProductsFlex
                  id="cartpage"
                  isLoading={isRelatedLoading}
                  products={relatedProducts}
                  maxWidth="100%"
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Order Summary */}
        <aside className="w-full lg:w-96 shrink-0">
          <OrderSummary
            cartId={cart?.id ?? null}
            subtotal={subtotal}
            total={total}
            surcharge={handlingSurcharge}
            refetch={refetch}
            coupon={cart?.coupon?.code}
            discountAmount={discountAmount}
          />
        </aside>
      </div>
    </div>
  );
};

type CartItemComponentProps = {
  item: any;
  refetch: () => void;
  refetchCount: () => void;
};

const CartItemComponent = ({
  item,
  refetch,
  refetchCount,
}: CartItemComponentProps) => {
  // console.log(item, "caritem");
  const itemTotal = Number(item.subtotalAtAdd);

  const maxQuantity = Math.max(
    1,
    Math.min(10, item.productSize?.quantity ?? 10),
  );

  const axiosSecure = useAxiosSecure();

  // update quantity
  const updateQuantity = async (quantity: number) => {
    await axiosSecure.patch(`/cart/items/${item.id}`, {
      quantity,
    });

    pushGTMEvent({
      event: "add_to_cart",
      currency: "BDT",
      value: Number(item.priceAtAdd) * quantity,
      items: [{ ...buildCartItem(item), quantity }],
    });

    refetch();
  };

  // remove cart / delete cart
  const handleRemoveItem = async () => {
    let visitorId = null;
    isAuthenticated() && (visitorId = getVisitorId());
    await axiosSecure.delete(`/cart/items/${item.id}`, {
      data: { visitorId },
    });

    pushGTMEvent({
      event: "remove_from_cart",
      currency: "BDT",
      value: Number(item.priceAtAdd) * item.quantity,
      items: [{ ...buildCartItem(item), quantity: item.quantity }],
    });

    refetch();
    refetchCount();
  };

  return (
    <div className="flex flex-col md:flex-row py-6 border-b border-gray-200 gap-4 items-start md:items-center">
      {/* Product Image & Info */}
      <div className="flex flex-2 gap-4 w-full">
        <Link
          href={`products/${item?.productSize?.color?.product?.slug}`}
          className="w-24 h-32 bg-gray-100 shrink-0 overflow-hidden
             transition-all duration-300
             hover:shadow-md hover:-translate-y-0.5"
        >
          <img
            src={item?.productSize?.color?.product?.images?.[0]?.image || ""}
            alt={item?.productSize?.color?.product?.title || "Product"}
            className="object-cover w-full h-full
               transition-transform duration-300
               hover:scale-110"
            onError={(e) =>
              (e.currentTarget.src = "/images/categories/fallback.jpg")
            }
          />
        </Link>

        <div className="text-sm space-y-1 flex-1">
          <Link
            href={`products/${item?.productSize?.color?.product?.slug}`}
            className="font-medium transition-colors duration-200
               hover:text-primary hover:underline"
          >
            {item?.productSize?.color?.product?.title}
          </Link>
          <p className="text-gray-600">Color: {item.color}</p>
          <p className="text-gray-600">Size: {item.size}</p>
          <div className="flex gap-4 mt-4 text-xs underline cursor-pointer">
            <span onClick={handleRemoveItem}>Remove</span>
            {/* <span>Save for Later</span> */}
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="flex flex-1 w-full justify-between md:justify-center items-center text-sm">
        <span className="md:hidden font-semibold">Price:</span>
        <span className="flex items-center">
          <TakaIcon /> {Number(item.priceAtAdd).toLocaleString()}
        </span>
      </div>

      {/* Quantity */}
      <div className="flex flex-1 w-full justify-between md:justify-center items-center">
        <span className="md:hidden text-sm">Qty:</span>
        <select
          className="border border-gray-300 p-1 text-sm w-16 bg-transparent"
          value={item.quantity}
          onChange={(e) => updateQuantity(Number(e.target.value))}
        >
          {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Total */}
      <div className="flex flex-1 w-full justify-between md:justify-end items-center font-medium">
        <span className="md:hidden text-sm">Total:</span>
        <span className="flex items-center">
          <TakaIcon /> {Number(itemTotal).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default CartPageComponent;
