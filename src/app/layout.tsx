import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import localFont from "next/font/local";
import { Bodoni_Moda, Cinzel } from "next/font/google";
import { Toaster } from "react-hot-toast";
import RoleBasedHeader from "@/component/Headers/RoleBasedHeader";
import RoleBasedFooter from "@/component/Headers/RoleBasedFooter";
import Header from "@/component/Headers/Header";
import Footer from "@/component/Footer/Footer";
import {
  GTMNoScript,
  GTMScript,
} from "@/component/TagManager/GoogleTagManager";
import {
  MetaPixelNoScript,
  MetaPixelScript,
} from "@/component/TagManager/MetaPixel";
import WhatsAppButton from "@/component/WhatsApp/WhatsAppButton";
import { Suspense } from "react";
import PageViewTracker from "@/component/PageView/PageViewTracker";

const avenir = localFont({
  src: "../../public/fonts/avenir/AvenirNext-Regular.woff",
});

export const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-bodoni",
  display: "swap",
});

export const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

interface Company {
  name: string;
  metaTitle: string | null;
  metaDescription: string | null;
  favicon: string | null;
  ogImage: string | null;
  metaPixelId: string | null;
}

async function getCompany(): Promise<Company | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompany();

  return {
    title: company?.metaTitle || company?.name || "Ondorkotha",
    description:
      company?.metaDescription || "Premium Furniture Marketplace",
    ...(company?.favicon && { icons: { icon: company.favicon } }),
    ...(company?.ogImage && {
      openGraph: { images: [company.ogImage] },
    }),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const company = await getCompany();

  return (
    <html lang="en" className={`${bodoni.variable} ${cinzel.variable} regular`}>
      <head>
        <GTMScript />
        <MetaPixelScript pixelId={company?.metaPixelId ?? null} />
      </head>
      <body>
        <GTMNoScript />
        <MetaPixelNoScript pixelId={company?.metaPixelId ?? null} />
        <Providers>
          {/* page view tracker */}
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
          <RoleBasedHeader />
          {children}
          <RoleBasedFooter />
          <WhatsAppButton />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#1f1f1f",
                color: "#ffffff",
                fontSize: "13px",
                letterSpacing: "0.05em",
                padding: "14px 18px",
                borderRadius: "6px",
              },
              success: {
                iconTheme: {
                  primary: "#ffffff",
                  secondary: "#1f1f1f",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ffffff",
                  secondary: "#1f1f1f",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
