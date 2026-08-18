import { Metadata } from "next";
import BlogPageComponent from "@/component/Blog/BlogPageComponent";
import { getSeoOverride, seoOverrideToMetadata } from "@/lib/seo/getSeoOverride";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface BlogSummary {
  title: string;
  content: string;
  image: string | null;
}

async function getBlog(slug: string): Promise<BlogSummary | null> {
  try {
    const res = await fetch(`${API_URL}/blogs/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const stripMarkdown = (md: string) =>
  md
    .replace(/#+\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [blog, seoOverride] = await Promise.all([
    getBlog(slug),
    getSeoOverride(`/blogs/${slug}`),
  ]);

  if (!blog) return seoOverrideToMetadata(seoOverride, { title: "Blog | Ondorkotha" });

  const description = stripMarkdown(blog.content).slice(0, 160);

  return seoOverrideToMetadata(seoOverride, {
    title: `${blog.title} | Ondorkotha`,
    description,
    openGraph: {
      title: blog.title,
      description,
      ...(blog.image && { images: [blog.image] }),
    },
  });
}

const BlogPage = () => {
  return (
    <div>
      <BlogPageComponent />
    </div>
  );
};

export default BlogPage;
