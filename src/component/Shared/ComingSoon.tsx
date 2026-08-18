import Link from "next/link";
import { Construction } from "lucide-react";

/**
 * Honest placeholder for pages that exist (a route/nav entry is already
 * wired up) but the feature behind them isn't built yet. Prevents a
 * literally blank screen — see the "no page should show nothing" UX pass.
 */
export default function ComingSoon({
  title,
  description,
  backHref,
  backLabel = "Go back",
}: {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-6 py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Construction className="h-7 w-7 text-gray-400" />
      </div>
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        {description ?? "This feature isn't available yet."}
      </p>
      <Link
        href={backHref}
        className="mt-6 inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        {backLabel}
      </Link>
    </div>
  );
}
