import { Metadata } from "next";
import CategoryWiseProduct from "@/component/ProductDisplay/ByCategory/CategoryWiseProduct";
import FeaturedReview from "@/component/Reviews/FeaturedReview";
import { getSeoOverride, seoOverrideToMetadata } from "@/lib/seo/getSeoOverride";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface CategorySummary {
  name: string | null;
}

async function getCategory(slug: string): Promise<CategorySummary | null> {
  try {
    const res = await fetch(`${API_URL}/category/${slug}`, {
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
  const [category, seoOverride] = await Promise.all([
    getCategory(slug),
    getSeoOverride(`/categories/${slug}`),
  ]);

  return seoOverrideToMetadata(seoOverride, {
    title: category?.name
      ? `${category.name} | Ondorkotha`
      : "Category | Ondorkotha",
    description: category?.name
      ? `Shop ${category.name} furniture at Ondorkotha.`
      : undefined,
  });
}

const CategoryWiseProductPage = () => {
  return (
    <div>
      <CategoryWiseProduct />

      {/* Featured Review */}
      <div className="px-4 md:px-12 lg:px-40 pb-8">
        <FeaturedReview />
      </div>
    </div>
  );
};

export default CategoryWiseProductPage;
