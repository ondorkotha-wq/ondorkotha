import { notFound } from "next/navigation";
import { Metadata } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { getSeoOverride, seoOverrideToMetadata } from "@/lib/seo/getSeoOverride";
import { sanitizeCmsHtml } from "@/lib/sanitizeHtml";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Company {
  name: string;
  privacyPolicy: string | null;
  metaTitle?: string | null;
}

async function getCompany(): Promise<Company | null> {
  try {
    const res = await fetch(`${API_URL}/company`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Company fetch failed: ${res.status}`);
    return res.json();
  } catch (err) {
    // Don't fail `next build` when the API is unreachable. At runtime, throw so
    // ISR keeps serving the last good page instead of caching a 404.
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return null;
    throw err;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const [company, seoOverride] = await Promise.all([
    getCompany(),
    getSeoOverride("/privacy-policy"),
  ]);
  return seoOverrideToMetadata(seoOverride, {
    title: `Privacy Policy | ${company?.name ?? "Ondorkotha"}`,
  });
}

export default async function PrivacyPolicyPage() {
  const company = await getCompany();

  if (!company || !company.privacyPolicy) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-8 py-16 text-[#222222]">
      <h1 className="text-3xl font-light mb-10">Privacy Policy</h1>
      <div
        className="prose-static"
        dangerouslySetInnerHTML={{
          __html: sanitizeCmsHtml(company.privacyPolicy),
        }}
      />
    </main>
  );
}
