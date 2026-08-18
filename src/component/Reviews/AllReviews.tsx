/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import useFetchProductReview from "@/hooks/Products/Review/useFetchProductReview";
import { RefreshButton } from "../Shared/Admin/AdminUI/AdminUI";
import toast from "react-hot-toast";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg
        key={s}
        className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400" : "text-slate-200"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

// ─── Rating Distribution Bar ──────────────────────────────────────────────────
const RatingBar = ({
  star,
  count,
  total,
}: {
  star: number;
  count: number;
  total: number;
}) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right text-slate-500 font-medium">{star}</span>
      <svg
        className="w-3 h-3 text-amber-400 shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-slate-400 tabular-nums">{count}</span>
    </div>
  );
};

// ─── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ name }: { name: string }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = [
    "bg-violet-100 text-violet-600",
    "bg-blue-100 text-blue-600",
    "bg-emerald-100 text-emerald-600",
    "bg-rose-100 text-rose-600",
    "bg-amber-100 text-amber-600",
    "bg-cyan-100 text-cyan-600",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${color}`}
    >
      {initials || "?"}
    </div>
  );
};

// ─── Status Pill ───────────────────────────────────────────────────────────────
const StatusPill = ({
  isHidden,
  isFeatured,
}: {
  isHidden: boolean;
  isFeatured: boolean;
}) => {
  if (isFeatured)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600 border border-violet-100">
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Featured
      </span>
    );
  if (isHidden)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-400 border border-slate-100">
        <svg
          className="w-2.5 h-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          />
        </svg>
        Hidden
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
      Visible
    </span>
  );
};

const ToggleAction = ({
  label,
  isActive,
  onToggle,
  activeClass,
}: {
  label: string;
  isActive: boolean;
  onToggle: () => void;
  activeClass: string;
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${
      isActive
        ? `${activeClass} border-transparent shadow-sm`
        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
    }`}
  >
    {label}
  </button>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const AllReviewsComp = () => {
  const {
    reviews = [],
    isLoading,
    refetch,
  } = useFetchProductReview({ isHidden: null });
  const axiosSecure = useAxiosSecure();

  // const { updateStatus, isUpdating } = useUpdateReviewStatus();

  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "visible" | "hidden" | "featured"
  >("all");
  const [search, setSearch] = useState("");
  const limit = 10;
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = reviews.length;
    const avg =
      total > 0
        ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / total
        : 0;
    const dist = [5, 4, 3, 2, 1].map((s) => ({
      star: s,
      count: reviews.filter((r: any) => r.rating === s).length,
    }));
    const featured = reviews.filter((r: any) => r.isFeatured).length;
    const hidden = reviews.filter((r: any) => r.isHidden).length;
    return { total, avg: avg.toFixed(1), dist, featured, hidden };
  }, [reviews]);

  // ── Filtered + paginated ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return reviews.filter((r: any) => {
      if (ratingFilter !== null && r.rating !== ratingFilter) return false;
      if (statusFilter === "visible" && r.isHidden) return false;
      if (statusFilter === "hidden" && !r.isHidden) return false;
      if (statusFilter === "featured" && !r.isFeatured) return false;
      if (
        search &&
        !r.user?.name?.toLowerCase().includes(search.toLowerCase()) &&
        !r.comment?.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [reviews, ratingFilter, statusFilter, search]);

  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const handleFilter = (val: typeof statusFilter) => {
    setStatusFilter(val);
    setPage(1);
  };

  // --- Toggle Handler ---
  const handleUpdate = async (
    reviewId: number,
    data: { isHidden?: boolean; isFeatured?: boolean },
  ) => {
    setUpdatingId(reviewId);
    try {
      // Pass 'data' as the second argument to send it in the request body
      await axiosSecure.patch(`/reviews/${reviewId}`, data);

      toast.success("Review updated successfully");
      refetch(); // Refresh the list to reflect changes
    } catch (error) {
      console.error(`Update failed for ${reviewId}:`, error);
      toast.error("Failed to update review status");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-slate-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
            Product Reviews
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {stats.total} total reviews
          </p>
        </div>
        <RefreshButton onClick={refetch} loading={isLoading} />
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Rating */}
        <div className="col-span-2 lg:col-span-1 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Avg Rating
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-slate-800 leading-none">
              {stats.avg}
            </span>
            <span className="text-slate-400 text-sm mb-0.5">/ 5</span>
          </div>
          <StarRating rating={Math.round(Number(stats.avg))} />
        </div>

        {/* Distribution */}
        <div className="col-span-2 lg:col-span-2 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
            Distribution
          </p>
          <div className="space-y-1.5">
            {stats.dist.map(({ star, count }) => (
              <RatingBar
                key={star}
                star={star}
                count={count}
                total={stats.total}
              />
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="col-span-2 lg:col-span-1 grid grid-cols-2 gap-3">
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 flex flex-col justify-between">
            <p className="text-xs font-medium text-violet-400 uppercase tracking-wider">
              Featured
            </p>
            <p className="text-2xl font-bold text-violet-700 mt-1">
              {stats.featured}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Hidden
            </p>
            <p className="text-2xl font-bold text-slate-600 mt-1">
              {stats.hidden}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name or comment…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 bg-slate-50 placeholder-slate-300"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["all", "visible", "hidden", "featured"] as const).map((f) => (
              <button
                key={f}
                onClick={() => handleFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  statusFilter === f
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Star filter */}
          <div className="flex items-center gap-1">
            {[null, 5, 4, 3, 2, 1].map((s) => (
              <button
                key={s ?? "all"}
                onClick={() => {
                  setRatingFilter(s);
                  setPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  ratingFilter === s
                    ? "bg-amber-400 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-amber-50"
                }`}
              >
                {s === null ? "All ★" : `${s}★`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-slate-100 bg-slate-50/60">
                {[
                  "Reviewer",
                  "Rating",
                  "Comment",
                  "Status",
                  "Actions",
                  "Date",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center text-slate-400"
                  >
                    <svg
                      className="w-8 h-8 mx-auto mb-3 text-slate-200"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                      />
                    </svg>
                    No reviews found
                  </td>
                </tr>
              ) : (
                paginated.map((review: any, idx: number) => (
                  <tr
                    key={review.id}
                    className={`border-t border-slate-50 hover:bg-slate-50/80 transition-colors group ${idx % 2 === 0 ? "" : "bg-slate-50/20"}`}
                  >
                    {/* Reviewer */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={review.user?.name || "Anonymous"} />
                        <div>
                          <p className="font-medium text-slate-700 text-sm leading-tight">
                            {review.user?.name || "Anonymous"}
                          </p>
                          {review.user?.id && (
                            <p className="text-xs text-slate-400">
                              ID #{review.user.id}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        <StarRating rating={review.rating} />
                        <span className="text-xs font-semibold text-slate-600">
                          {review.rating}.0 / 5
                        </span>
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="px-5 py-3.5 max-w-xs">
                      {review.comment ? (
                        <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                          {review.comment}
                        </p>
                      ) : (
                        <span className="text-slate-300 text-xs italic">
                          No comment
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusPill
                        isHidden={review.isHidden}
                        isFeatured={review.isFeatured}
                      />
                    </td>

                    {/* Actions Cell (The Interactive Part) */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          disabled={updatingId === review.id}
                          onClick={() =>
                            handleUpdate(review.id, {
                              isFeatured: !review.isFeatured,
                            })
                          }
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all border ${
                            review.isFeatured
                              ? "bg-violet-600 text-white border-transparent"
                              : "bg-white text-slate-400 border-slate-200 hover:border-violet-300"
                          } disabled:opacity-50`}
                        >
                          {updatingId === review.id ? "..." : "Featured"}
                        </button>

                        <button
                          disabled={updatingId === review.id}
                          onClick={() =>
                            handleUpdate(review.id, {
                              isHidden: !review.isHidden,
                            })
                          }
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all border ${
                            review.isHidden
                              ? "bg-rose-600 text-white border-transparent"
                              : "bg-white text-slate-400 border-slate-200 hover:border-rose-300"
                          } disabled:opacity-50`}
                        >
                          {updatingId === review.id ? "..." : "Hidden"}
                        </button>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5">
                      <div className="text-xs text-slate-500">
                        <p>
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </p>
                        <p className="text-slate-300">
                          {new Date(review.createdAt).toLocaleTimeString(
                            "en-GB",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Showing {(page - 1) * limit + 1}–
              {Math.min(page * limit, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p =
                  totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page - 3 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                      p === page
                        ? "bg-violet-600 text-white shadow-sm"
                        : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllReviewsComp;
