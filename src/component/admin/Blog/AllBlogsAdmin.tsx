/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  Tag,
  Calendar,
  ChevronDown,
  FileText,
  Globe,
  Lock,
  ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingDots from "@/component/Loading/LoadingDS";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { DeleteConfirmationModal } from "../Modal/DeleteConfirmationModal";
import useFetchBlogCategories, { BlogCategory } from "@/hooks/Blog/useFetchBlogCategories";
import useFetchBlogsAdmin from "@/hooks/Admin/Blog/useFetchBlogsAdmin";
import { BlogPost } from "@/types/blog";
import { useHasPermission } from "@/context/PermissionsContext";

// ── Types ─────────────────────────────────────────────────────────────────────
type FilterStatus = "all" | "published" | "draft";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const truncate = (str: string, n: number) =>
  str.length > n ? str.slice(0, n) + "…" : str;

const stripMarkdown = (md: string) =>
  md
    .replace(/#+\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s/gm, "")
    .replace(/^-\s/gm, "")
    .trim();

// simple debounce hook
function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Main Component ─────────────────────────────────────────────────────────────
const AllBlogsAdminComp: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const canCreate = useHasPermission("BLOG_CREATE");
  const canUpdate = useHasPermission("BLOG_UPDATE");
  const canDelete = useHasPermission("BLOG_DELETE");

  // ── All state declared before hooks that depend on them ──
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterCategorySlug, setFilterCategorySlug] = useState<string | null>(
    null,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 400);

  // backend: category=slug|null, published=boolean|null (not string)
  const { blogPosts, meta, summary, isLoading, refetch } = useFetchBlogsAdmin({
    activeCategory: filterCategorySlug,
    page,
    limit: 10,
    search: debouncedSearch,
    published:
      filterStatus === "published"
        ? "true"
        : filterStatus === "draft"
          ? "false"
          : null,
  });

  const { blogCategories } = useFetchBlogCategories();

  // stats from server — always full counts, unaffected by pagination
  const stats = summary ?? { total: 0, published: 0, draft: 0 };

  // ── Actions ──
  const togglePublish = useCallback(
    async (blog: BlogPost) => {
      setTogglingId(blog.id);
      try {
        await axiosSecure.patch(`/blogs/${blog.id}`, {
          published: !blog.published,
        });
        toast.success(
          `"${blog.title}" is now ${!blog.published ? "published" : "unpublished"}`,
        );
        await refetch();
      } catch {
        toast.error("Failed to update publish status");
      } finally {
        setTogglingId(null);
      }
    },
    [axiosSecure, refetch],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await axiosSecure.delete(`/blogs/${deleteId}`);
      toast.success("Blog post deleted");
      setDeleteId(null);
      await refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }, [axiosSecure, deleteId, refetch]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };
  const handleStatusChange = (s: FilterStatus) => {
    setFilterStatus(s);
    setPage(1);
  };
  const handleCategoryChange = (slug: string | null) => {
    setFilterCategorySlug(slug);
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (filterStatus !== "all") n++;
    if (filterCategorySlug !== null) n++;
    return n;
  }, [filterStatus, filterCategorySlug]);

  // only full-screen spinner on the very first load
  if (isLoading && page === 1 && !blogPosts?.length) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
              <span className="p-2 bg-teal-50 rounded-xl">
                <BookOpen className="w-5 h-5 text-teal-600" />
              </span>
              Blog Posts
            </h1>
            <p className="text-sm text-slate-400 mt-1 ml-1">
              Manage and publish your editorial content
            </p>
          </div>
          {canCreate && (
            <Link
              href="/admin/blog/add"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Post
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Total Posts"
            value={stats.total}
            icon={<FileText className="w-4 h-4" />}
            color="slate"
            onClick={() => handleStatusChange("all")}
            active={filterStatus === "all"}
          />
          <StatCard
            label="Published"
            value={stats.published}
            icon={<Globe className="w-4 h-4" />}
            color="teal"
            onClick={() => handleStatusChange("published")}
            active={filterStatus === "published"}
          />
          <StatCard
            label="Drafts"
            value={stats.draft}
            icon={<Lock className="w-4 h-4" />}
            color="amber"
            onClick={() => handleStatusChange("draft")}
            active={filterStatus === "draft"}
          />
        </div>

        {/* Search + Filter */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 flex-1">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by title or content…"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1 text-sm text-slate-700 placeholder:text-slate-300 bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              onClick={() => setIsFilterOpen((p) => !p)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full font-medium">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {isFilterOpen && (
            <div className="border-t border-slate-100 px-4 py-4 flex flex-wrap gap-6 bg-slate-50/50">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Status
                </p>
                <div className="flex gap-2">
                  {(["all", "published", "draft"] as FilterStatus[]).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all capitalize ${filterStatus === s ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"}`}
                      >
                        {s}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Category
                </p>
                <div className="flex flex-wrap gap-2">
                  {/* null slug = "All" — matches backend expecting null */}
                  <button
                    onClick={() => handleCategoryChange(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${filterCategorySlug === null ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"}`}
                  >
                    All
                  </button>
                  {blogCategories?.map((cat: BlogCategory) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.slug)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${filterCategorySlug === cat.slug ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      handleStatusChange("all");
                      handleCategoryChange(null);
                    }}
                    className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingDots />
            </div>
          ) : blogPosts && blogPosts.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Post
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
                        Category
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                        Date
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {blogPosts.map((blog) => (
                      <BlogRow
                        key={blog.id}
                        blog={blog}
                        isToggling={togglingId === blog.id}
                        onTogglePublish={() => togglePublish(blog)}
                        onDelete={() => setDeleteId(blog.id)}
                        canUpdate={canUpdate}
                        canDelete={canDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination + footer */}
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400">
                  {meta
                    ? `Page ${meta.page} of ${meta.totalPages} · ${meta.total} posts`
                    : `${blogPosts.length} posts`}
                </span>
                {meta && meta.totalPages > 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(meta.totalPages, p + 1))
                      }
                      disabled={page === meta.totalPages}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              hasSearch={!!(searchQuery || activeFiltersCount)}
              onClear={() => {
                handleSearchChange("");
                handleStatusChange("all");
                handleCategoryChange(null);
              }}
              canCreate={canCreate}
            />
          )}
        </div>
      </div>

      {deleteId && (
        <DeleteConfirmationModal
          open={!!deleteId}
          isLoading={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

// ── BlogRow ───────────────────────────────────────────────────────────────────
interface BlogRowProps {
  blog: BlogPost;
  isToggling: boolean;
  onTogglePublish: () => void;
  onDelete: () => void;
  canUpdate: boolean;
  canDelete: boolean;
}

const BlogRow: React.FC<BlogRowProps> = ({
  blog,
  isToggling,
  onTogglePublish,
  onDelete,
  canUpdate,
  canDelete,
}) => {
  const excerpt = truncate(stripMarkdown(blog.content), 90);
  return (
    <tr className="hover:bg-slate-50/60 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-100 bg-slate-100 flex-shrink-0 flex items-center justify-center">
            {blog.image ? (
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-slate-300" />
            )}
          </div>
          <div className="min-w-0 max-w-sm">
            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
              {blog.title}
            </p>
            {excerpt && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                {excerpt}
              </p>
            )}
            <p className="text-[11px] font-mono text-slate-300 mt-1 truncate">
              /blog/{blog.slug}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        {blog.category ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
            <Tag className="w-3 h-3" />
            {blog.category.name}
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </td>
      <td className="px-6 py-4 hidden lg:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(blog.updatedAt ?? blog.createdAt)}
        </div>
      </td>
      <td className="px-6 py-4">
        <button
          onClick={canUpdate ? onTogglePublish : undefined}
          disabled={isToggling || !canUpdate}
          title={canUpdate ? "Click to toggle" : undefined}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-50 ${canUpdate ? "hover:scale-105 active:scale-95 cursor-pointer" : "cursor-default"} ${blog.published ? "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200" : "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${blog.published ? "bg-teal-500" : "bg-amber-400"}`}
          />
          {isToggling ? "…" : blog.published ? "Published" : "Draft"}
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canUpdate && (
            <button
              onClick={onTogglePublish}
              disabled={isToggling}
              title={blog.published ? "Unpublish" : "Publish"}
              className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors disabled:opacity-50"
            >
              {blog.published ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
          {canUpdate && (
            <Link
              href={`/admin/blog/update/${blog.slug}`}
              className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Edit post"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
          )}
          {canUpdate && (
            <Link
              href={`/admin/cms/seo?url=${encodeURIComponent(`/blogs/${blog.slug}`)}`}
              className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Manage SEO for this page"
            >
              <Search className="w-4 h-4" />
            </Link>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              title="Delete post"
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "slate" | "teal" | "amber";
  onClick: () => void;
  active: boolean;
}

const colorMap = {
  slate: {
    bg: "bg-slate-50",
    activeBg: "bg-slate-800",
    icon: "text-slate-500",
    activeIcon: "text-white",
    value: "text-slate-800",
    activeValue: "text-white",
    label: "text-slate-400",
    activeLabel: "text-slate-300",
    border: "border-slate-200",
    activeBorder: "border-slate-800",
  },
  teal: {
    bg: "bg-teal-50",
    activeBg: "bg-teal-600",
    icon: "text-teal-500",
    activeIcon: "text-white",
    value: "text-teal-700",
    activeValue: "text-white",
    label: "text-teal-400",
    activeLabel: "text-teal-100",
    border: "border-teal-100",
    activeBorder: "border-teal-600",
  },
  amber: {
    bg: "bg-amber-50",
    activeBg: "bg-amber-500",
    icon: "text-amber-500",
    activeIcon: "text-white",
    value: "text-amber-700",
    activeValue: "text-white",
    label: "text-amber-400",
    activeLabel: "text-amber-100",
    border: "border-amber-100",
    activeBorder: "border-amber-500",
  },
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color,
  onClick,
  active,
}) => {
  const c = colorMap[color];
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border-2 px-5 py-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] w-full ${active ? `${c.activeBg} ${c.activeBorder}` : `${c.bg} ${c.border}`}`}
    >
      <div className={`mb-2 ${active ? c.activeIcon : c.icon}`}>{icon}</div>
      <p className={`text-2xl font-bold ${active ? c.activeValue : c.value}`}>
        {value}
      </p>
      <p className={`text-xs mt-0.5 ${active ? c.activeLabel : c.label}`}>
        {label}
      </p>
    </button>
  );
};

// ── EmptyState ────────────────────────────────────────────────────────────────
const EmptyState: React.FC<{
  hasSearch: boolean;
  onClear: () => void;
  canCreate: boolean;
}> = ({ hasSearch, onClear, canCreate }) => (
  <div className="text-center py-16 px-6">
    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <BookOpen className="w-6 h-6 text-slate-400" />
    </div>
    <h3 className="text-base font-semibold text-slate-700 mb-1">
      {hasSearch ? "No posts match your filters" : "No blog posts yet"}
    </h3>
    <p className="text-sm text-slate-400 mb-5">
      {hasSearch
        ? "Try adjusting your search or clearing the filters."
        : "Get started by creating your first blog post."}
    </p>
    {hasSearch ? (
      <button
        onClick={onClear}
        className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
      >
        Clear filters
      </button>
    ) : (
      canCreate && (
        <Link
          href="/admin/blog/add"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm rounded-xl hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create first post
        </Link>
      )
    )}
  </div>
);

export default AllBlogsAdminComp;
