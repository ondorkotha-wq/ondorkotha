import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSeoOverride, seoOverrideToMetadata } from "@/lib/seo/getSeoOverride";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Company {
  name: string;
  about: string | null;
}

async function getCompany(): Promise<Company | null> {
  try {
    const res = await fetch(`${API_URL}/company`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const [company, seoOverride] = await Promise.all([
    getCompany(),
    getSeoOverride("/about"),
  ]);
  return seoOverrideToMetadata(seoOverride, {
    title: `About Us | ${company?.name ?? "Ondorkotha"}`,
  });
}

export default async function AboutPage() {
  const company = await getCompany();

  if (!company || !company.about) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-8 py-16 text-[#222222]">
      <h1 className="text-3xl font-light mb-10">About Us</h1>
      <div
        className="prose-static"
        dangerouslySetInnerHTML={{ __html: company.about }}
      />
    </main>
  );
}
