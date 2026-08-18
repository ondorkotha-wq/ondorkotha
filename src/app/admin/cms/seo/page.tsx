import { Suspense } from "react";
import SeoAdmin from "@/component/admin/SEO/SeoAdmin";

export const metadata = { title: "SEO | Admin" };

export default function SeoPage() {
  return (
    <Suspense>
      <SeoAdmin />
    </Suspense>
  );
}
