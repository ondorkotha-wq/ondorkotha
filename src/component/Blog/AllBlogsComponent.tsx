/* eslint-disable @next/next/no-img-element */
"use client";
import useFetchBlogCategories from "@/hooks/Blog/useFetchBlogCategories";
import useFetchBlogs from "@/hooks/Blog/useFetchBlogs";
import Link from "next/link";
import { useState } from "react";
import { FullScreenCenter } from "../Screen/FullScreenCenter";
import LoadingDots from "../Loading/LoadingDS";

export default function AllBlogsComponent() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { blogCategories, isLoading: isBlogCategories } =
    useFetchBlogCategories();
  const {
    blogPosts,
    meta,
    isLoading: isBlogsLoading,
  } = useFetchBlogs({
    activeCategory,
    page,
    limit: 6,
    search: "",
  });

  if (isBlogsLoading || isBlogCategories) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  return (
    <div className="max-w-360 mx-auto px-4 sm:px-10 py-16 min-h-screen font-serif">
      {/* Header Section: Shifted to a "Design Journal" feel */}
      <header className="text-center mb-16">
        <div className="flex items-center justify-center gap-3 text-[#8c764d] uppercase tracking-[0.25em] text-[10px] mb-4">
          <span className="h-px w-8 bg-[#8c764d]"></span>
          <span>
            {activeCategory ? activeCategory.replace("-", " ") : "The Journal"}
          </span>
          <span className="h-px w-8 bg-[#8c764d]"></span>
        </div>

        <h1 className="text-3xl md:text-5xl tracking-tight font-light text-slate-900 mb-6 italic">
          {activeCategory
            ? `Curating ${activeCategory.replace("-", " ")}`
            : "Art of Living"}
        </h1>

        <p className="text-slate-500 max-w-xl mx-auto font-sans text-sm md:text-base leading-relaxed font-light">
          Explore our collection of interior inspiration, master craftsmanship
          stories, and guides to creating a home that breathes.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Sidebar: Refined with "Atelier" styling */}
        <aside className="lg:w-1/4">
          <div className="lg:hidden mb-10">
            <select
              className="w-full border-b border-slate-300 bg-transparent py-3 text-xs tracking-widest uppercase focus:outline-none"
              value={activeCategory ?? ""}
              onChange={(e) => setActiveCategory(e.target.value || null)}
            >
              <option value="">All Collections</option>
              {blogCategories?.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <nav className="hidden lg:block sticky top-10">
            <h3 className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-8 font-bold">
              Filter by Space
            </h3>
            <ul className="space-y-5 text-sm tracking-wide text-slate-600">
              <li
                className={`cursor-pointer transition-colors duration-300 hover:text-slate-900 ${
                  activeCategory === null
                    ? "text-slate-900 font-semibold border-l-2 border-slate-900 pl-4"
                    : "pl-4"
                }`}
                onClick={() => {
                  setActiveCategory(null);
                  setPage(1);
                }}
              >
                All Stories
              </li>

              {blogCategories?.map((cat) => (
                <li
                  key={cat.id}
                  className={`cursor-pointer transition-colors duration-300 hover:text-slate-900 ${
                    activeCategory === cat.slug
                      ? "text-slate-900 font-semibold border-l-2 border-slate-900 pl-4"
                      : "pl-4"
                  }`}
                  onClick={() => {
                    setActiveCategory(cat.slug);
                    setPage(1);
                  }}
                >
                  {cat.name}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Blog Main Grid: Switched to 2 columns for a more "Architectural" feel */}
        <main className="lg:w-3/4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16">
            {blogPosts.length === 0 ? (
              <p className="flex items-center justify-center text-center text-gray-500 p-12">
                No Blog Found
              </p>
            ) : (
              blogPosts?.map((post) => (
                <Link
                  href={`/blogs/${post.slug}`}
                  key={post.id}
                  className="group"
                >
                  <article>
                    {/* Furniture photography looks best in 3:2 or 16:9 rather than 4:5 */}
                    <div className="aspect-[3/2] overflow-hidden mb-6 bg-slate-100">
                      <img
                        src={post.image || "/placeholder-furniture.jpg"}
                        alt={post.title}
                        className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                      />
                    </div>

                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#8c764d] font-semibold">
                        {post.category?.name || "Interior Design"}
                      </span>
                      <h3 className="text-xl md:text-2xl text-slate-850 font-light leading-tight group-hover:text-[#8c764d] transition-colors">
                        {post.title}
                      </h3>
                      <div className="pt-2">
                        <span className="text-xs uppercase tracking-tighter border-b border-slate-900 pb-1">
                          Read the story
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))
            )}
          </div>

          {/* meta / pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-16 font-sans">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-sm px-4 py-2 border border-slate-300 disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-slate-500">
                Page {meta.page} of {meta.totalPages}
              </span>

              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-sm px-4 py-2 border border-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
