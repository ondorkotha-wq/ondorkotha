import { Metadata } from "next";
import { SeoEntry } from "@/types/seo.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Server-side fetch of an admin-managed SEO override for a given public
// page path. Returns null when no override exists — callers fall back to
// their own entity-derived metadata.
export async function getSeoOverride(url: string): Promise<SeoEntry | null> {
  try {
    const res = await fetch(
      `${API_URL}/seo/lookup?url=${encodeURIComponent(url)}`,
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.id ? data : null;
  } catch {
    return null;
  }
}

// Maps an SeoEntry onto Next's Metadata shape, layered on top of whatever
// fallback metadata the caller already computed (entity-derived or default).
export function seoOverrideToMetadata(
  seo: SeoEntry | null,
  fallback: Metadata,
): Metadata {
  if (!seo) return fallback;

  const fallbackOg =
    typeof fallback.openGraph === "object" && fallback.openGraph
      ? fallback.openGraph
      : {};

  return {
    ...fallback,
    title: seo.title || fallback.title,
    description: seo.description || fallback.description,
    keywords: seo.keywords
      ? seo.keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : undefined,
    ...(seo.canonical && { alternates: { canonical: seo.canonical } }),
    openGraph: {
      ...fallbackOg,
      title: seo.ogTitle || seo.title || fallback.title || undefined,
      description:
        seo.ogDescription || seo.description || fallback.description || undefined,
      ...(seo.ogImage && { images: [seo.ogImage] }),
    },
    ...((seo.noIndex || seo.noFollow) && {
      robots: { index: !seo.noIndex, follow: !seo.noFollow },
    }),
  };
}
