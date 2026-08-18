"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pushGTMEvent } from "@/lib/gtm";

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    pushGTMEvent({
      event: "page_view",
      page_path: url,
    });

    // Meta Pixel base code only fires PageView on the initial hard load —
    // client-side route changes need an explicit re-fire.
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void })
      .fbq;
    if (typeof fbq === "function") {
      fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}