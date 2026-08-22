/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FullOrder,
  GetAllOrdersOptions,
  PaginatedOrdersResponse,
  ThumbOrder,
} from "@/hooks/Order/useOrders";
import React, { Dispatch, SetStateAction } from "react";
import ChevronPagination from "../../Pagination/Pagination";
import Link from "next/link";
import { ChevronRight, PackageSearch, Boxes } from "lucide-react";

interface OrderSectionProps {
  orders: PaginatedOrdersResponse<ThumbOrder | FullOrder> | null;
  refetch: (params?: any) => void;
  options?: any;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  orderOptions: GetAllOrdersOptions;
  setOrderOptions: Dispatch<SetStateAction<GetAllOrdersOptions>>;
}

const OrdersSection: React.FC<OrderSectionProps> = ({
  orders,
  refetch,
  options,
  getStatusColor,
  getStatusIcon,
  orderOptions,
  setOrderOptions,
}) => {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-3xl font-light">Order History</h1>
        {!!orders?.meta.total && (
          <p className="text-sm text-gray-500">
            {orders.meta.total} order{orders.meta.total > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {orders?.data.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 px-6 bg-white border border-gray-200">
            <PackageSearch className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-700 font-medium mb-1">
              You have no orders yet
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Your placed orders will show up here for you to track.
            </p>
            <Link
              href="/"
              className="bg-black text-white px-8 py-3 text-xs font-bold tracking-[0.2em] uppercase hover:bg-gray-800 transition active:scale-95"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          orders?.data.map((order) => (
            <Link
              key={order.orderId}
              href={`/order?orderId=${order.orderId}`}
              className="group flex items-center gap-4 bg-white border border-gray-200 p-5 sm:p-6 hover:border-gray-400 hover:shadow-sm transition active:scale-[0.99]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-medium mb-1 group-hover:text-gray-600 transition-colors truncate">
                      {order.orderId}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 flex items-center gap-1 px-3 py-1 text-xs font-medium capitalize rounded-full ${getStatusColor(
                      order.status,
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <p className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Boxes className="w-4 h-4 text-gray-400" />
                    {order.itemCount} item
                    {order.itemCount && order.itemCount > 1 ? "s" : ""}
                  </p>
                  <p className="text-lg font-medium">
                    ৳{order.total.toLocaleString()}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {!!orders?.data.length && (
        <ChevronPagination
          currentPage={orders?.meta.page ?? 1}
          totalPages={orders?.meta.totalPages ?? 1}
          onPageChange={(page) => setOrderOptions({ ...orderOptions, page })}
        />
      )}
    </div>
  );
};

export default OrdersSection;
