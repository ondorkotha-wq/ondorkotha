import ProductPageComponent from '@/component/ProductDisplay/ShowEachProduct';
import { Metadata } from 'next';
import { getSeoOverride, seoOverrideToMetadata } from '@/lib/seo/getSeoOverride';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getProductSchema(slug: string) {
  try {
    const res = await fetch(`${API_URL}/product/${slug}/schema`, {
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
  const [schema, seoOverride] = await Promise.all([
    getProductSchema(slug),
    getSeoOverride(`/products/${slug}`),
  ]);
  const productSchema = Array.isArray(schema)
    ? schema.find((s: { '@type': string }) => s['@type'] === 'Product')
    : null;

  if (!productSchema)
    return seoOverrideToMetadata(seoOverride, { title: 'Product | Ondorkotha' });

  const images = Array.isArray(productSchema.image)
    ? productSchema.image.slice(0, 1)
    : [];

  return seoOverrideToMetadata(seoOverride, {
    title: `${productSchema.name} | Ondorkotha`,
    description: productSchema.description ?? 'Premium furniture at Ondorkotha',
    openGraph: {
      title: productSchema.name,
      description: productSchema.description ?? '',
      images,
    },
  });
}

export default async function ProductById({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const schema = await getProductSchema(slug);

  return (
    <div>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <ProductPageComponent />
    </div>
  );
}