// app/dashboard/Components/RecentOrders.tsx
import type { RecentOrder } from "@/lib/api/actions/dashboard";

interface Props {
  orders: RecentOrder[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-gray-100 text-gray-600" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700" },
  processing: { label: "Processing", className: "bg-amber-100 text-amber-700" },
  shipped: { label: "Shipped", className: "bg-violet-100 text-violet-700" },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-100 text-emerald-700",
  },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

const paymentConfig: Record<string, string> = {
  cod: "COD",
  bkash: "bKash",
  card: "Card",
  nagad: "Nagad",
  bank: "Bank",
};

export default function RecentOrders({ orders }: Props) {
  if (!orders?.length) {
    return (
      <div className="px-6 py-10 text-center text-sm text-gray-400">
        No recent orders
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {orders.map((order) => {
            const status =
              statusConfig[order.status] ?? statusConfig["pending"];
            return (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {order.customer}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{order.id}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      {paymentConfig[order.payment] ?? order.payment}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.date).toLocaleDateString("en-BD", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                  ৳{order.amount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${status.className}`}
                  >
                    {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
