"use client";
import useFetchActiveUrgencyBanner from "@/hooks/Homepage/Banner/useFetchActiveUrgencyBanner";
import Link from "next/link";

const UrgencyBanner = () => {
  const { banner, isLoading } = useFetchActiveUrgencyBanner();

  if (isLoading || !banner) return null;

  const content = (
    <div className="w-full bg-amber-500 text-white text-center py-2 px-4 text-sm font-semibold tracking-wide">
      {banner.message}
    </div>
  );

  if (banner.link) {
    return <Link href={banner.link}>{content}</Link>;
  }

  return content;
};

export default UrgencyBanner;
