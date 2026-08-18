// app/dashboard/Components/TopViewedProducts.tsx
// Replace SearchAnalytics with this component.
// In DashboardPageComp: import TopViewedProducts from "./Components/TopViewedProducts"
// and pass data={data.topViewedProducts}

import type { TopViewedProduct } from "@/lib/api/actions/dashboard";
import { Eye } from "lucide-react";

interface Props {
  data: TopViewedProduct[];
}

export default function TopViewedProducts({ data }: Props) {
  if (!data?.length) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        No view data for this period
      </div>
    );
  }

  const maxViews = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={item.productId}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-gray-400 w-4 shrink-0">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {item.title}
                </p>
                <p className="text-xs text-gray-400">{item.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2 text-gray-500">
              <Eye size={12} />
              <span className="text-xs font-medium">
                {item.views.toLocaleString()}
              </span>
            </div>
          </div>

          {/* View volume bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full transition-all"
              style={{ width: `${(item.views / maxViews) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}