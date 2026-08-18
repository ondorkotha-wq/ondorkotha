/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { notFound, useParams } from "next/navigation";
import { Tag, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";

import ShowProductsFlex from "../ProductDisplay/ShowProductsFlex";
import LoadingDots from "../Loading/LoadingDS";
import Title from "../Headers/Title";
import { FullScreenCenter } from "../Screen/FullScreenCenter";

import useFetchABlog from "@/hooks/Blog/useFetchABlog";
import { BlogPost } from "@/types/blog";
import useFetchRelatedProducts from "@/hooks/Products/RelatedProducts/useFetchRelatedProducts";

// ── Markdown Parser ───────────────────────────────────────────────────────────
const parseMarkdown = (raw: string): string => {
  // 1. Escape HTML entities
  let html = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Headings
  html = html.replace(
    /^#### (.+)$/gm,
    '<h4 class="text-base font-semibold text-gray-800 mt-8 mb-2 tracking-wide">$1</h4>',
  );
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-xl font-semibold text-gray-800 mt-10 mb-3 tracking-tight">$1</h3>',
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-2xl font-light text-gray-900 mt-12 mb-4 tracking-tight border-b border-gray-100 pb-3">$1</h2>',
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="text-3xl md:text-4xl font-light text-gray-900 mt-12 mb-6 tracking-tight">$1</h1>',
  );

  // 3. Horizontal rule
  html = html.replace(
    /^---$/gm,
    '<hr class="my-10 border-t border-gray-200" />',
  );

  // 4. Blockquote
  html = html.replace(
    /^&gt; (.+)$/gm,
    '<blockquote class="border-l-4 border-[#b2965d] pl-6 my-8 italic text-gray-600 text-xl font-serif leading-relaxed">$1</blockquote>',
  );

  // 5. List items
  html = html.replace(
    /^- (.+)$/gm,
    '<li class="flex items-start gap-3 mb-2 text-gray-700 text-lg font-serif leading-relaxed"><span class="mt-2.5 w-1.5 h-1.5 rounded-full bg-[#b2965d] flex-shrink-0"></span><span>$1</span></li>',
  );
  html = html.replace(
    /^\d+\. (.+)$/gm,
    '<li class="mb-2 text-gray-700 text-lg font-serif leading-relaxed list-decimal ml-5">$1</li>',
  );

  // 6. Wrap consecutive li blocks into ul/ol
  html = html.replace(/(<li[\s\S]*?<\/li>\n?)+/g, (match) => {
    if (match.includes("list-decimal")) {
      return `<ol class="my-6 space-y-1">${match}</ol>`;
    }
    return `<ul class="my-6 space-y-1">${match}</ul>`;
  });

  // 7. Inline formatting
  html = html.replace(
    /\*\*\*(.+?)\*\*\*/g,
    '<strong class="font-bold italic text-gray-900">$1</strong>',
  );
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-semibold text-gray-900">$1</strong>',
  );
  html = html.replace(/\*(.+?)\*/g, '<em class="italic text-gray-800">$1</em>');
  html = html.replace(
    /`(.+?)`/g,
    '<code class="bg-gray-100 text-rose-600 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>',
  );
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, text: string, url: string) => {
      const safeUrl = /^(https?:|mailto:|\/|#)/i.test(url.trim())
        ? url
        : "#";
      return `<a href="${safeUrl}" class="text-teal-700 underline underline-offset-4 hover:text-teal-900 transition-colors" target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  );

  // 8. Paragraph wrapping — skip already-block-level HTML tags
  const BLOCK_TAG = /^<(h[1-6]|ul|ol|li|blockquote|hr|figure|div)/;
  html = html
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (BLOCK_TAG.test(trimmed)) return trimmed;
      return `<p class="mb-6 font-serif leading-relaxed text-gray-700 text-lg">${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { blog, isLoading } = useFetchABlog(slug);

  const subcategoryIds = blog?.subCategories?.map((b: any) => b.id);

  const joinedIDs = subcategoryIds?.join(",");

  const { relatedProducts, isLoading: isRelatedLoading } =
    useFetchRelatedProducts({
      isEnabled: !isLoading && !!joinedIDs,
      categoryIds: joinedIDs,
    });

  if (isLoading)
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );

  if (!blog) return notFound();

  const post: BlogPost = blog;

  return (
    <article className="min-h-screen bg-[#f9f7f2] selection:bg-teal-50">
      {/* Navigation */}
      <nav className="max-w-4xl mx-auto px-6 pt-10">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Back to Stories
        </Link>
      </nav>

      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 py-16 text-center">
        {/* Category label */}
        <div className="flex items-center justify-center gap-3 text-[#b2965d] uppercase tracking-[0.3em] text-[10px] mb-10">
          <span className="block w-6 border-b border-[#b2965d]" />
          <span>
            stories:{" "}
            <span className="italic lowercase font-normal">
              {post.category?.name}
            </span>
          </span>
          <span className="block w-6 border-b border-[#b2965d]" />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-light text-gray-900 leading-[1.1] mb-10 tracking-tight">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-sans">
          <span className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            {new Date(post.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="w-px h-4 bg-gray-200" />
          <span className="flex items-center gap-2">
            <Tag className="w-3 h-3" />
            {post.category?.name}
          </span>
        </div>
      </header>

      {/* Hero Image */}
      {post.image && (
        <div className="max-w-6xl mx-auto px-4 md:px-10 mb-20">
          <div className="aspect-video md:aspect-[21/9] overflow-hidden rounded-sm shadow-md">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 pb-24">
        <div
          dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag: any) => (
              <span
                key={tag.id}
                className="text-[11px] font-sans bg-stone-100 text-stone-500 px-3 py-1.5 rounded-full tracking-wide"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Subcategories */}
        {post.subCategories && post.subCategories.length > 0 && (
          <footer className="mt-16 pt-10 border-t border-gray-200">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-6">
              Explore More
            </h4>
            <div className="flex flex-wrap gap-3">
              {post.subCategories.map((item: any, idx: number) => (
                <span
                  key={idx}
                  className="text-sm italic text-gray-500 hover:text-teal-700 cursor-pointer transition-colors"
                >
                  #{item?.name?.replace(/\s+/g, "")}
                </span>
              ))}
            </div>
          </footer>
        )}
      </div>

      {/* Related Products */}
      {(isRelatedLoading || relatedProducts.length > 0) && (
        <div className="max-w-7xl mx-auto px-6 pb-24">
          <Title title="Recommended Furniture" />
          <ShowProductsFlex
            id="blogpost"
            isLoading={isRelatedLoading}
            products={relatedProducts}
            maxWidth="100%"
          />
        </div>
      )}
    </article>
  );
}
