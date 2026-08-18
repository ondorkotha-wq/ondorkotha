import { notFound } from "next/navigation";
import { Metadata } from "next";
import { StaticPage } from "@/types/static-page";
import { getSeoOverride, seoOverrideToMetadata } from "@/lib/seo/getSeoOverride";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getPage(slug: string): Promise<StaticPage | null> {
  try {
    const res = await fetch(`${API_URL}/static-pages/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [page, seoOverride] = await Promise.all([
    getPage(slug),
    getSeoOverride(`/pages/${slug}`),
  ]);
  if (!page) return { title: "Not Found" };

  return seoOverrideToMetadata(seoOverride, {
    title: page.metaTitle ?? `${page.title} | Ondorkotha`,
    description: page.metaDescription ?? undefined,
  });
}

export default async function StaticPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page || !page.isActive) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-8 py-16 text-[#222222]">
      <h1 className="text-3xl font-light mb-10 capitalize">{page.title}</h1>
      <div
        className="prose-static"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </main>
  );
}
