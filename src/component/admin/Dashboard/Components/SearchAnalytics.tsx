// app/dashboard/Components/SearchAnalytics.tsx
import type { TopSearchKeyword } from "@/lib/api/actions/dashboard";

interface Props {
  keywords: TopSearchKeyword[];
}

export default function SearchAnalytics({ keywords }: Props) {
  if (!keywords?.length) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        No search data for this period
      </div>
    );
  }

  const maxCount = Math.max(...keywords.map((k) => k.count), 1);

  return (
    <div className="space-y-4">
      {keywords.map((kw, index) => (
        <div key={kw.keyword}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-gray-400 w-4 shrink-0">
                {index + 1}
              </span>
              <span className="text-sm font-medium text-gray-800 truncate">
                {kw.keyword}
              </span>
            </div>
            <span className="text-xs text-gray-500 shrink-0 ml-2">
              {kw.count.toLocaleString()}
            </span>
          </div>

          {/* Search volume bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full transition-all"
              style={{ width: `${(kw.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
