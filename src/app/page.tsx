import Homepage from "@/component/Homepage";
import styles from "./page.module.css";
import { Metadata } from "next";
import { getSeoOverride, seoOverrideToMetadata } from "@/lib/seo/getSeoOverride";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Company {
  name: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
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
    getSeoOverride("/"),
  ]);
  return seoOverrideToMetadata(seoOverride, {
    title: company?.metaTitle || company?.name || "Ondorkotha",
    description: company?.metaDescription || "Premium Furniture Marketplace",
    ...(company?.ogImage && { openGraph: { images: [company.ogImage] } }),
  });
}

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Homepage></Homepage>
      </main>
    </div>
  );
}
