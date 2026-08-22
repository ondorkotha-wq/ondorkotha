import React from "react";
import { Package, Clock, Truck, ChevronRight, Boxes } from "lucide-react";
import Link from "next/link";
import {
  FullOrder,
  PaginatedOrdersResponse,
  ThumbOrder,
} from "@/hooks/Order/useOrders";

interface Order {
  orderId: string;
  createdAt: string;
  status: string;
  itemCount: number;
  total: number;
}

interface Orders {
  data: Order[];
  meta: {
    total: number;
  };
}

interface OverviewSectionProps {
  user: string | undefined;
  orders: PaginatedOrdersResponse<ThumbOrder | FullOrder> | null;
  setActiveItem: (id: string) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({
  user,
  orders,
  setActiveItem,
  getStatusColor,
  getStatusIcon,
}) => {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          Welcome back, {user?.split(" ")[0]}
        </h1>
        <p className="text-gray-600 text-sm">
          Track your orders and manage your account
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <Package className="w-10 h-10 text-gray-400" />
            <span className="text-3xl font-light">{orders?.meta?.total}</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Total Orders</p>
        </div>

        <div className="bg-white p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-10 h-10 text-gray-400" />
            <span className="text-3xl font-light">
              {orders?.statusCounts.PENDING}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Processing</p>
        </div>

        <div className="bg-white p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <Truck className="w-10 h-10 text-gray-400" />
            <span className="text-3xl font-light">
              {orders?.statusCounts.SHIPPED}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">In Transit</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light">Recent Orders</h2>
          <button
            onClick={() => setActiveItem("orders")}
            className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {orders?.data.length === 0 ? (
            <div className="text-center py-10 bg-white border border-gray-200">
              <p className="text-gray-500 text-sm">No orders yet.</p>
            </div>
          ) : (
            orders?.data.slice(0, 3).map((order) => (
              <Link
                key={order.orderId}
                href={`/order?orderId=${order.orderId}`}
                className="group flex items-center gap-4 bg-white border border-gray-200 p-6 hover:border-gray-400 hover:shadow-sm transition active:scale-[0.99]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm mb-1 group-hover:text-gray-600 transition-colors truncate">
                        {order.orderId}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
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
                  <div className="flex items-center justify-between mt-4">
                    <p className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Boxes className="w-4 h-4 text-gray-400" />
                      {order.itemCount} item
                      {order.itemCount && order.itemCount > 1 ? "s" : ""}
                    </p>
                    <p className="font-medium">
                      ৳{order.total.toLocaleString()}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
