"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ArrowLeft, Plus, Pencil, Trash2, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { SeoEntry } from "@/types/seo.types";
import axios from "axios";

type View = "list" | "edit";

interface FormState {
  url: string;
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  noIndex: boolean;
  noFollow: boolean;
}

const empty: FormState = {
  url: "",
  title: "",
  description: "",
  keywords: "",
  canonical: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  noIndex: false,
  noFollow: false,
};

export default function SeoAdmin() {
  const axiosSecure = useAxiosSecure();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<View>("list");
  const [entries, setEntries] = useState<SeoEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<FormState>(empty);
  const [isNewEntry, setIsNewEntry] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SeoEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosSecure.get<SeoEntry[]>("/seo");
      setEntries(data);
      return data;
    } catch {
      toast.error("Failed to load SEO entries");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchEntries().then((data) => {
      // Deep link from a Product/Category/Blog editor: ?url=/products/foo
      const prefillUrl = searchParams.get("url");
      if (!prefillUrl) return;
      const existing = data.find((e) => e.url === prefillUrl);
      if (existing) {
        openEdit(existing);
      } else {
        setForm({ ...empty, url: prefillUrl });
        setIsNewEntry(true);
        setView("edit");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEntries]);

  const openNew = () => {
    setForm(empty);
    setIsNewEntry(true);
    setView("edit");
  };

  const openEdit = (entry: SeoEntry) => {
    setForm({
      url: entry.url,
      title: entry.title ?? "",
      description: entry.description ?? "",
      keywords: entry.keywords ?? "",
      canonical: entry.canonical ?? "",
      ogTitle: entry.ogTitle ?? "",
      ogDescription: entry.ogDescription ?? "",
      ogImage: entry.ogImage ?? "",
      noIndex: entry.noIndex,
      noFollow: entry.noFollow,
    });
    setIsNewEntry(false);
    setView("edit");
  };

  const backToList = () => {
    setView("list");
    setDeleteTarget(null);
    if (searchParams.get("url")) router.replace("/admin/cms/seo");
  };

  const handleSave = async () => {
    const url = form.url.trim();
    if (!url) return toast.error("URL is required");
    if (!url.startsWith("/"))
      return toast.error("URL must start with / (e.g. /products/sofa-set-classic)");

    setIsSaving(true);
    try {
      await axiosSecure.post("/seo", {
        url,
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
        keywords: form.keywords.trim() || undefined,
        canonical: form.canonical.trim() || undefined,
        ogTitle: form.ogTitle.trim() || undefined,
        ogDescription: form.ogDescription.trim() || undefined,
        ogImage: form.ogImage.trim() || undefined,
        noIndex: form.noIndex,
        noFollow: form.noFollow,
      });
      toast.success("SEO entry saved");
      backToList();
      fetchEntries();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : null;
      toast.error(msg ?? "Failed to save SEO entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axiosSecure.delete(`/seo/${deleteTarget.id}`);
      toast.success("SEO entry deleted");
      setDeleteTarget(null);
      fetchEntries();
    } catch {
      toast.error("Failed to delete SEO entry");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── LIST VIEW ───────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">SEO — Page Meta</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Override title, description, and social tags for any page by its URL.
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            New Entry
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-sm text-gray-400">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-gray-500">No SEO overrides yet.</p>
              <button
                onClick={openNew}
                className="mt-3 text-sm cursor-pointer text-indigo-600 hover:underline hover:underline-offset-4 hover:text-indigo-700"
              >
                Create your first entry
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    URL
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Title
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">
                    Updated
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 font-mono text-xs text-gray-700">
                      <div className="flex items-center gap-2">
                        {entry.url}
                        {(entry.noIndex || entry.noFollow) && (
                          <span
                            title="Blocked from search indexing"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700"
                          >
                            <EyeOff size={9} />
                            {entry.noIndex ? "noindex" : "nofollow"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {entry.title || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-gray-400 text-xs">
                      {new Date(entry.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(entry)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(entry)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Delete SEO entry?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-mono text-gray-700">{deleteTarget.url}</span> will
                go back to its default page title/description.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── EDIT VIEW ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={backToList}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {isNewEntry ? "New SEO Entry" : `Edit — ${form.url}`}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Applies to whatever page is served at this URL on the storefront.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Page URL <span className="text-red-500">*</span>
              </label>
              <input
                value={form.url}
                onChange={(e) => set("url", e.target.value.trim())}
                disabled={!isNewEntry}
                placeholder="/products/sofa-set-classic"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                Examples: <span className="font-mono">/</span>,{" "}
                <span className="font-mono">/products/&lt;slug&gt;</span>,{" "}
                <span className="font-mono">/categories/&lt;slug&gt;</span>,{" "}
                <span className="font-mono">/blogs/&lt;slug&gt;</span>,{" "}
                <span className="font-mono">/pages/&lt;slug&gt;</span>. Cannot be
                changed after saving — delete and recreate instead.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">Meta Title</label>
                <span
                  className={`text-xs ${form.title.length > 70 ? "text-red-500" : "text-gray-400"}`}
                >
                  {form.title.length}/70
                </span>
              </div>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                maxLength={70}
                placeholder="Sofa Set Classic | Ondorkotha"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Meta Description
                </label>
                <span
                  className={`text-xs ${form.description.length > 160 ? "text-red-500" : "text-gray-400"}`}
                >
                  {form.description.length}/160
                </span>
              </div>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Handcrafted classic sofa set, built for Bangladeshi homes…"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none"
              />
            </div>

            {/* Google preview */}
            {(form.title || form.url) && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Google preview</p>
                <p className="text-sm text-blue-700 leading-tight truncate">
                  {form.title || "Ondorkotha"}
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  ondorkotha.com{form.url || ""}
                </p>
                {form.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {form.description}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Keywords
              </label>
              <input
                value={form.keywords}
                onChange={(e) => set("keywords", e.target.value)}
                placeholder="sofa, furniture, living room"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Canonical URL
              </label>
              <input
                value={form.canonical}
                onChange={(e) => set("canonical", e.target.value)}
                placeholder="https://ondorkotha.com/products/sofa-set-classic"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Open Graph */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Social Sharing (Open Graph)
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                OG Title
              </label>
              <input
                value={form.ogTitle}
                onChange={(e) => set("ogTitle", e.target.value)}
                placeholder="Falls back to Meta Title if empty"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                OG Description
              </label>
              <textarea
                value={form.ogDescription}
                onChange={(e) => set("ogDescription", e.target.value)}
                rows={2}
                placeholder="Falls back to Meta Description if empty"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                OG Image URL
              </label>
              <input
                value={form.ogImage}
                onChange={(e) => set("ogImage", e.target.value)}
                placeholder="https://…/share-image.jpg"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Indexing
            </h3>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">No Index</span>
              <button
                type="button"
                onClick={() => set("noIndex", !form.noIndex)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  form.noIndex ? "bg-indigo-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    form.noIndex ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">No Follow</span>
              <button
                type="button"
                onClick={() => set("noFollow", !form.noFollow)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  form.noFollow ? "bg-indigo-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    form.noFollow ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Saving…" : "Save Entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
