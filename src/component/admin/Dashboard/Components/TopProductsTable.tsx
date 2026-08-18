// app/dashboard/Components/TopProductsTable.tsx
import type { TopProduct } from "@/lib/api/actions/dashboard";

interface Props {
  products: TopProduct[];
}

const statusConfig = {
  in_stock: { label: "In Stock", className: "bg-emerald-100 text-emerald-700" },
  low_stock: { label: "Low Stock", className: "bg-amber-100 text-amber-700" },
  out_of_stock: { label: "Out of Stock", className: "bg-red-100 text-red-700" },
};

export default function TopProductsTable({ products }: Props) {
  if (!products?.length) {
    return (
      <div className="px-6 py-10 text-center text-sm text-gray-400">
        No product data for this period
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sales
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Revenue
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {products.map((product, index) => {
            const status = statusConfig[product.status];
            return (
              <tr
                key={product.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <span className="w-5 text-xs font-medium text-gray-400 shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.category}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-700">
                  {product.sales.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                  ৳{product.revenue.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}
                  >
                    {product.stock > 0 ? product.stock : status.label}
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
