"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { StaticPage } from "@/types/static-page";
import axios from "axios";

type View = "list" | "edit";

interface FormState {
  slug: string;
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
}

const empty: FormState = {
  slug: "",
  title: "",
  content: "",
  metaTitle: "",
  metaDescription: "",
  isActive: true,
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function StaticPagesAdmin() {
  const axiosSecure = useAxiosSecure();

  const [view, setView] = useState<View>("list");
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<FormState>(empty);
  const [isNewPage, setIsNewPage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaticPage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fetchPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosSecure.get<StaticPage[]>(
        "/static-pages"
      );
      setPages(data);
    } catch {
      toast.error("Failed to load pages");
    } finally {
      setIsLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const openNew = () => {
    setForm(empty);
    setIsNewPage(true);
    setView("edit");
  };

  const openEdit = (page: StaticPage) => {
    setForm({
      slug: page.slug,
      title: page.title,
      content: page.content,
      metaTitle: page.metaTitle ?? "",
      metaDescription: page.metaDescription ?? "",
      isActive: page.isActive,
    });
    setIsNewPage(false);
    setView("edit");
  };

  const backToList = () => {
    setView("list");
    setDeleteTarget(null);
  };

  const handleSave = async () => {
    if (!form.slug.trim()) return toast.error("Slug is required");
    if (!SLUG_RE.test(form.slug))
      return toast.error(
        "Slug must be lowercase with hyphens only (e.g. about-us)"
      );
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.content.trim()) return toast.error("Content is required");

    setIsSaving(true);
    try {
      await axiosSecure.put(`/static-pages/${form.slug}`, {
        title: form.title,
        content: form.content,
        metaTitle: form.metaTitle.trim() || null,
        metaDescription: form.metaDescription.trim() || null,
        isActive: form.isActive,
      });
      toast.success("Page saved");
      backToList();
      fetchPages();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : null;
      toast.error(msg ?? "Failed to save page");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axiosSecure.delete(`/static-pages/${deleteTarget.slug}`);
      toast.success("Page deleted");
      setDeleteTarget(null);
      fetchPages();
    } catch {
      toast.error("Failed to delete page");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── LIST VIEW ───────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Static Pages
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage public pages like About, Terms, Privacy Policy
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            New Page
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-sm text-gray-400">
              Loading…
            </div>
          ) : pages.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-gray-500">No pages yet.</p>
              <button
                onClick={openNew}
                className="mt-3 text-sm cursor-pointer text-indigo-600 hover:underline hover:underline-offset-4 hover:text-indigo-700"
              >
                Create your first page
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Slug
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Title
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">
                    URL
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pages.map((page) => (
                  <tr key={page.slug} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 font-mono text-xs text-gray-700">
                      {page.slug}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {page.title}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                          page.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {page.isActive ? (
                          <Eye size={10} />
                        ) : (
                          <EyeOff size={10} />
                        )}
                        {page.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-gray-400 text-xs">
                      /pages/{page.slug}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(page)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(page)}
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

        {/* Delete confirmation modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Delete page?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-mono text-gray-700">
                  {deleteTarget.slug}
                </span>{" "}
                will be permanently removed.
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={backToList}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {isNewPage ? "New Page" : `Edit — ${form.slug}`}
          </h1>
          {!isNewPage && (
            <p className="text-xs text-gray-400 mt-0.5">
              Live at{" "}
              <span className="font-mono">/pages/{form.slug}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Slug — only editable for new pages */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Slug <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2.5 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-400">
                  /pages/
                </span>
                <input
                  value={form.slug}
                  onChange={(e) =>
                    set("slug", e.target.value.toLowerCase().replace(/\s/g, "-"))
                  }
                  disabled={!isNewPage}
                  placeholder="about-us"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-r-lg text-sm font-mono focus:outline-none focus:border-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              {isNewPage && (
                <p className="text-xs text-gray-400 mt-1">
                  Lowercase letters and hyphens only. Cannot be changed after
                  saving.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="About Us"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Content (HTML) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder={"<h1>About Us</h1>\n<p>Our story...</p>"}
              rows={18}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-400 resize-y"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Visibility
            </h3>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">Active (visible to public)</span>
              <button
                type="button"
                onClick={() => set("isActive", !form.isActive)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  form.isActive ? "bg-indigo-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    form.isActive ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Saving…" : "Save Page"}
            </button>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              SEO
            </h3>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Meta Title
                </label>
                <span
                  className={`text-xs ${
                    form.metaTitle.length > 70
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                >
                  {form.metaTitle.length}/70
                </span>
              </div>
              <input
                value={form.metaTitle}
                onChange={(e) => set("metaTitle", e.target.value)}
                maxLength={70}
                placeholder="About Us | Ondorkotha"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Meta Description
                </label>
                <span
                  className={`text-xs ${
                    form.metaDescription.length > 160
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                >
                  {form.metaDescription.length}/160
                </span>
              </div>
              <textarea
                value={form.metaDescription}
                onChange={(e) => set("metaDescription", e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Learn about our handcrafted furniture…"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none"
              />
            </div>

            {/* Google preview */}
            {(form.metaTitle || form.title) && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Google preview</p>
                <p className="text-sm text-blue-700 leading-tight truncate">
                  {form.metaTitle || `${form.title} | Ondorkotha`}
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  ondorkotha.com/pages/{form.slug || "…"}
                </p>
                {form.metaDescription && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {form.metaDescription}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
