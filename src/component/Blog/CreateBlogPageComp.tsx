/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FormEvent,
} from "react";
import {
  Save,
  X,
  ImageIcon,
  Eye,
  EyeOff,
  ChevronRight,
  Plus,
  Loader2,
  CheckCircle2,
  FileText,
  Layers,
  Tag,
  Settings,
  BookOpen,
} from "lucide-react";
import useFetchSeries from "@/hooks/Categories/Series/useFetchSeries";
import useFetchCategoriesBySeriesIds from "@/hooks/Admin/Categories/useFetchCategoriesBySeriesIds";
import useFetchSubCategoriesByCategoryIds from "@/hooks/Categories/Subcategories/useFetchSubCategoriesByCategoryIds";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import toast from "react-hot-toast";
import axios from "axios";
import { handleUploadWithCloudinary } from "@/data/handleUploadWithCloudinary";
import { optimizeImage } from "@/utils/imageOptimizer";
import useFetchBlogCategories from "@/hooks/Blog/useFetchBlogCategories";
import { generateSlug } from "@/utils/validation";
import useFetchABlogAdmin from "@/hooks/Admin/Blog/useFetchABlogAdmin";
import { useParams, useRouter } from "next/navigation";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import LoadingDots from "@/component/Loading/LoadingDS";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BlogPost {
  id?: number;
  title: string;
  slug: string;
  content: string;
  image?: string | null;
  published: boolean;
  blogCategoryId: number | null;
  selectedSubCategoryIds: number[];
}

type Step = "basics" | "content" | "media" | "associations" | "publish";

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "basics", label: "Basics", icon: <FileText className="w-4 h-4" /> },
  { id: "content", label: "Content", icon: <BookOpen className="w-4 h-4" /> },
  { id: "media", label: "Media", icon: <ImageIcon className="w-4 h-4" /> },
  { id: "associations", label: "Links", icon: <Layers className="w-4 h-4" /> },
  { id: "publish", label: "Publish", icon: <Settings className="w-4 h-4" /> },
];

// ── Markdown ──────────────────────────────────────────────────────────────────
const renderMarkdown = (text: string) => {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(
    /^### (.*$)/gim,
    '<h3 class="text-base font-semibold mt-5 mb-2 text-slate-800">$1</h3>',
  );
  html = html.replace(
    /^## (.*$)/gim,
    '<h2 class="text-lg font-semibold mt-7 mb-3 text-slate-800">$1</h2>',
  );
  html = html.replace(
    /^# (.*$)/gim,
    '<h1 class="text-xl font-bold mt-8 mb-4 text-slate-900">$1</h1>',
  );
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-semibold text-slate-900">$1</strong>',
  );
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(
    /`(.+?)`/g,
    '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-rose-600">$1</code>',
  );
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, text: string, url: string) => {
      const safeUrl = /^(https?:|mailto:|\/|#)/i.test(url.trim())
        ? url
        : "#";
      return `<a href="${safeUrl}" class="text-teal-600 hover:underline">${text}</a>`;
    },
  );
  html = html.replace(
    /^&gt; (.*$)/gim,
    '<blockquote class="border-l-3 border-slate-300 pl-4 italic text-slate-600 my-4">$1</blockquote>',
  );
  html = html.replace(/^---$/gim, '<hr class="my-5 border-slate-200" />');
  html = html.replace(
    /^\- (.+)$/gim,
    '<li class="ml-5 list-disc text-slate-700">$1</li>',
  );
  html = html.replace(
    /^\d+\. (.+)$/gim,
    '<li class="ml-5 list-decimal text-slate-700">$1</li>',
  );
  html = html
    .split("\n\n")
    .map((p) => {
      if (p.trim() && !p.match(/^<(h[1-3]|ul|ol|blockquote|hr|li)/)) {
        return `<p class="mb-4 leading-relaxed text-slate-700 text-sm">${p}</p>`;
      }
      return p;
    })
    .join("\n");

  return html;
};

// ── Image Uploader ────────────────────────────────────────────────────────────
const ImageUploader: React.FC<{
  image: File | null;
  existingUrl?: string | null;
  onImageChange: (file: File | null) => void;
}> = ({ image, existingUrl, onImageChange }) => {
  const [preview, setPreview] = useState<string>(existingUrl ?? "");

  useEffect(() => {
    if (image instanceof File) {
      const url = URL.createObjectURL(image);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [image]);

  useEffect(() => {
    if (!image && existingUrl) setPreview(existingUrl);
  }, [existingUrl]);

  return (
    <div>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
          <img src={preview} alt="Cover" className="w-full h-72 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
          <button
            type="button"
            onClick={() => {
              setPreview("");
              onImageChange(null);
            }}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-3">
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium cursor-pointer hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-sm">
              <ImageIcon className="w-3 h-3" /> Replace
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImageChange(f);
                }}
              />
            </label>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition-all group">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-slate-100 rounded-full group-hover:bg-teal-100 transition-colors">
              <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">
                Drop your cover image here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PNG, JPG, WebP up to 10MB
              </p>
            </div>
            <span className="px-4 py-1.5 bg-slate-800 text-white text-xs rounded-full font-medium group-hover:bg-teal-700 transition-colors">
              Browse files
            </span>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImageChange(f);
            }}
          />
        </label>
      )}
    </div>
  );
};

// ── Category Modal ────────────────────────────────────────────────────────────
const CategoryModal: React.FC<{
  onClose: () => void;
  onSave: (data: {
    name: string;
    slug?: string;
    order: number;
    isActive: boolean;
  }) => Promise<void>;
}> = ({ onClose, onSave }) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setSlug(generateSlug(e.target.value));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">New Blog Category</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Beauty & Wellness"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Sort Order
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                min={0}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${isActive ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${isActive ? "bg-teal-500" : "bg-slate-300"}`}
                />
                {isActive ? "Active" : "Inactive"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              await onSave({ name, slug: slug || undefined, order, isActive });
              setSaving(false);
            }}
            disabled={!name.trim() || saving}
            className="flex-1 px-4 py-2.5 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function CreateEditBlogPage() {
  const { slug } = useParams();
  const router = useRouter();
  const isEdit = !!slug;

  const { blog, isLoading: isBlogLoading } = useFetchABlogAdmin(
    slug ? String(slug) : undefined,
  );

  const axiosSecure = useAxiosSecure();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [activeStep, setActiveStep] = useState<Step>("basics");
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const {
    blogCategories,
    isLoading: isBlogCatsLoading,
    refetch,
  } = useFetchBlogCategories();
  const { seriesList } = useFetchSeries({ isActive: true });

  const [formData, setFormData] = useState<
    BlogPost & { imageFile: File | null }
  >({
    title: "",
    slug: "",
    content: "",
    image: null,
    imageFile: null,
    published: false,
    blogCategoryId: null,
    selectedSubCategoryIds: [],
    selectedSeriesIds: [] as any,
    selectedCategoryIds: [] as any,
  } as any);

  useEffect(() => {
    if (blog && slug) {
      setFormData((prev: any) => ({
        ...prev,
        title: (blog as any).title ?? "",
        slug: (blog as any).slug ?? "",
        content: (blog as any).content ?? "",
        image: (blog as any).image ?? null,
        imageFile: null,
        published: (blog as any).published ?? false,
        blogCategoryId:
          (blog as any).blogCategoryId ?? (blog as any).categoryId ?? null,
        selectedSubCategoryIds:
          (blog as any).selectedSubCategoryIds ??
          (blog as any).subCategories?.map((sc: any) => sc.id) ??
          [],
      }));
    }
  }, [blog, slug]);

  const { categoryList } = useFetchCategoriesBySeriesIds(
    (formData as any).selectedSeriesIds ?? [],
  );
  const { subCategoryList } = useFetchSubCategoriesByCategoryIds(
    (formData as any).selectedCategoryIds ?? [],
  );

  // Step completion checks
  const stepValid: Record<Step, boolean> = {
    basics: !!(formData.title && formData.slug && formData.blogCategoryId),
    content: formData.content.length > 10,
    media: true,
    associations: true,
    publish: true,
  };

  const completedSteps = STEPS.filter((s) => stepValid[s.id]);

  // Markdown toolbar insert
  const insertMarkdown = (
    prefix: string,
    suffix: string,
    placeholder: string,
  ) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = formData.content.substring(start, end) || placeholder;
    const before = formData.content.substring(0, start);
    const after = formData.content.substring(end);
    setFormData((p) => ({
      ...p,
      content: `${before}${prefix}${selected}${suffix}${after}`,
    }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length,
      );
    }, 0);
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((p) => ({
      ...p,
      title,
      ...(!isEdit ? { slug: generateSlug(title) } : {}),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.blogCategoryId) {
      toast.error("Select a blog category");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = typeof formData.image === "string" ? formData.image : null;

      if (formData.imageFile instanceof File) {
        const optimized = await optimizeImage(formData.imageFile);
        imageUrl = await handleUploadWithCloudinary(optimized);
      }

      const payload = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        image: imageUrl,
        published: formData.published,
        blogCategoryId: formData.blogCategoryId,
        selectedSubCategoryIds: (formData as any).selectedSubCategoryIds ?? [],
      };

      if (isEdit) {
        await axiosSecure.patch(`/blogs/${blog?.id}`, payload);
        toast.success("Blog post updated!");
      } else {
        await axiosSecure.post("/blogs", payload);
        toast.success("Blog post created!");
        setFormData({
          title: "",
          slug: "",
          content: "",
          image: null,
          imageFile: null,
          published: false,
          blogCategoryId: null,
          selectedSubCategoryIds: [],
          selectedSeriesIds: [],
          selectedCategoryIds: [],
        } as any);
        setActiveStep("basics");
        router.push("/admin/blog/all-blogs");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Something went wrong");
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (data: any) => {
    try {
      await axiosSecure.post("/blog-categories", data);
      await refetch();
      setIsCategoryModalOpen(false);
      toast.success("Category created");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create category");
    }
  };

  const toggleSubCat = (id: number) => {
    setFormData((p: any) => ({
      ...p,
      selectedSubCategoryIds: p.selectedSubCategoryIds.includes(id)
        ? p.selectedSubCategoryIds.filter((x: number) => x !== id)
        : [...p.selectedSubCategoryIds, id],
    }));
  };

  const toggleSeries = (id: number) => {
    setFormData((p: any) => ({
      ...p,
      selectedSeriesIds: p.selectedSeriesIds.includes(id)
        ? p.selectedSeriesIds.filter((x: number) => x !== id)
        : [...p.selectedSeriesIds, id],
      selectedCategoryIds: [],
      selectedSubCategoryIds: [],
    }));
  };

  const toggleCategory = (id: number) => {
    setFormData((p: any) => ({
      ...p,
      selectedCategoryIds: p.selectedCategoryIds.includes(id)
        ? p.selectedCategoryIds.filter((x: number) => x !== id)
        : [...p.selectedCategoryIds, id],
    }));
  };

  const TOOLBAR_BUTTONS = [
    {
      label: "B",
      title: "Bold",
      prefix: "**",
      suffix: "**",
      placeholder: "bold text",
      cls: "font-bold",
    },
    {
      label: "I",
      title: "Italic",
      prefix: "*",
      suffix: "*",
      placeholder: "italic text",
      cls: "italic",
    },
    {
      label: "H1",
      title: "Heading 1",
      prefix: "# ",
      suffix: "",
      placeholder: "Heading 1",
      cls: "font-semibold text-xs",
    },
    {
      label: "H2",
      title: "Heading 2",
      prefix: "## ",
      suffix: "",
      placeholder: "Heading 2",
      cls: "font-semibold text-xs",
    },
    {
      label: "H3",
      title: "Heading 3",
      prefix: "### ",
      suffix: "",
      placeholder: "Heading 3",
      cls: "font-semibold text-xs",
    },
    null,
    {
      label: "• List",
      title: "Bullet List",
      prefix: "- ",
      suffix: "",
      placeholder: "List item",
      cls: "",
    },
    {
      label: "1. List",
      title: "Numbered List",
      prefix: "1. ",
      suffix: "",
      placeholder: "Item",
      cls: "",
    },
    {
      label: "Link",
      title: "Link",
      prefix: "[",
      suffix: "](url)",
      placeholder: "link text",
      cls: "",
    },
    {
      label: "`code`",
      title: "Code",
      prefix: "`",
      suffix: "`",
      placeholder: "code",
      cls: "font-mono text-xs",
    },
    {
      label: '" Quote',
      title: "Quote",
      prefix: "> ",
      suffix: "",
      placeholder: "Quote",
      cls: "",
    },
    null,
    {
      label: "—",
      title: "Divider",
      prefix: "---\n",
      suffix: "",
      placeholder: "",
      cls: "",
    },
  ];

  if (slug && isBlogLoading) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-slate-800">
              {isEdit ? "Edit Post" : "New Blog Post"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {completedSteps.length}/{STEPS.length} sections complete
            </p>
          </div>

          {/* Progress bar */}
          <div className="hidden md:flex items-center gap-1">
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeStep === step.id
                      ? "bg-slate-800 text-white"
                      : stepValid[step.id]
                        ? "bg-teal-50 text-teal-700 hover:bg-teal-100"
                        : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {stepValid[step.id] && activeStep !== step.id ? (
                    <CheckCircle2 className="w-3 h-3 text-teal-500" />
                  ) : (
                    step.icon
                  )}
                  {step.label}
                </button>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit as any}
              disabled={submitting || !stepValid.basics || !stepValid.content}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {submitting
                ? isEdit
                  ? "Updating…"
                  : "Publishing…"
                : isEdit
                  ? formData.published
                    ? "Update Post"
                    : "Save Changes"
                  : formData.published
                    ? "Publish Post"
                    : "Save Draft"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Mobile steps */}
        <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-2">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeStep === step.id
                  ? "bg-slate-800 text-white"
                  : "bg-white border border-slate-200 text-slate-500"
              }`}
            >
              {step.icon}
              {step.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── STEP: BASICS ── */}
          {activeStep === "basics" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <SectionCard
                title="Basic Information"
                subtitle="Title, slug, and category"
              >
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Post Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={handleTitleChange}
                      placeholder="Enter a compelling title…"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      URL Slug
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-400">
                      <span className="px-4 py-3 bg-slate-50 text-slate-400 text-sm border-r border-slate-200 font-mono">
                        /blog/
                      </span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            slug: generateSlug(e.target.value),
                          }))
                        }
                        className="flex-1 px-4 py-3 text-sm font-mono text-slate-600 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Blog Category *
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors"
                      >
                        <Plus className="w-3 h-3" /> New category
                      </button>
                    </div>
                    {isBlogCatsLoading ? (
                      <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {blogCategories?.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                blogCategoryId: cat.id,
                              }))
                            }
                            className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                              formData.blogCategoryId === cat.id
                                ? "border-teal-500 bg-teal-50 text-teal-700"
                                : "border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── STEP: CONTENT ── */}
          {activeStep === "content" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <SectionCard
                title="Post Content"
                subtitle="Write your blog post in Markdown"
                action={
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 font-medium"
                  >
                    {showPreview ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                }
              >
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-3">
                  {TOOLBAR_BUTTONS.map((btn, i) =>
                    btn === null ? (
                      <div key={i} className="w-px h-5 bg-slate-200 mx-1" />
                    ) : (
                      <button
                        key={btn.label}
                        type="button"
                        title={btn.title}
                        onClick={() =>
                          insertMarkdown(
                            btn.prefix,
                            btn.suffix,
                            btn.placeholder,
                          )
                        }
                        className={`px-2.5 py-1.5 text-xs border border-transparent rounded-lg hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all text-slate-600 ${btn.cls}`}
                      >
                        {btn.label}
                      </button>
                    ),
                  )}
                </div>

                <div
                  className={`grid gap-4 ${showPreview ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={formData.content}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, content: e.target.value }))
                      }
                      placeholder={`# Your Post Title\n\nStart writing your post here...\n\n## Section One\n\nYour content.`}
                      rows={24}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none leading-relaxed"
                      required
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] text-slate-300 font-mono">
                      {formData.content.length} chars
                    </div>
                  </div>

                  {showPreview && (
                    <div className="border border-slate-200 rounded-xl px-5 py-4 overflow-y-auto h-[560px] bg-white">
                      {formData.content ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(formData.content),
                          }}
                        />
                      ) : (
                        <p className="text-slate-300 text-sm italic">
                          Preview appears here…
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <details className="mt-3">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 transition-colors select-none">
                    Markdown reference ↓
                  </summary>
                  <div className="mt-2 p-4 bg-slate-50 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    {[
                      {
                        title: "Formatting",
                        items: ["**bold**", "*italic*", "`code`"],
                      },
                      { title: "Headings", items: ["# H1", "## H2", "### H3"] },
                      { title: "Lists", items: ["- Bullet", "1. Numbered"] },
                      {
                        title: "Other",
                        items: ["[text](url)", "> Quote", "--- divider"],
                      },
                    ].map((group) => (
                      <div key={group.title}>
                        <p className="font-semibold text-slate-600 mb-1.5">
                          {group.title}
                        </p>
                        {group.items.map((item) => (
                          <code
                            key={item}
                            className="block text-slate-400 mb-1 font-mono"
                          >
                            {item}
                          </code>
                        ))}
                      </div>
                    ))}
                  </div>
                </details>
              </SectionCard>
            </div>
          )}

          {/* ── STEP: MEDIA ── */}
          {activeStep === "media" && (
            <div className="animate-in fade-in duration-200">
              <SectionCard
                title="Cover Image"
                subtitle="Displayed at the top of your post"
              >
                <ImageUploader
                  image={formData.imageFile as any}
                  existingUrl={
                    typeof formData.image === "string" ? formData.image : null
                  }
                  onImageChange={(file) =>
                    setFormData((p) => ({
                      ...p,
                      imageFile: file,
                      ...(file === null ? { image: null } : {}),
                    }))
                  }
                />
                {!formData.imageFile && !formData.image && (
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    Cover image is optional but recommended for better
                    engagement.
                  </p>
                )}
              </SectionCard>
            </div>
          )}

          {/* ── STEP: ASSOCIATIONS ── */}
          {activeStep === "associations" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <SectionCard
                title="Product Associations"
                subtitle="Link this post to product subcategories"
              >
                <div className="space-y-6">
                  {/* Series */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                      Series
                    </label>
                    {seriesList?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {seriesList.map((s: any) => (
                          <ToggleChip
                            key={s.id}
                            label={s.name}
                            active={(
                              formData as any
                            ).selectedSeriesIds?.includes(s.id)}
                            onClick={() => toggleSeries(s.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="No series available" />
                    )}
                  </div>

                  {/* Categories */}
                  {(formData as any).selectedSeriesIds?.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                        Categories
                      </label>
                      {categoryList?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {categoryList.map((c: any) => (
                            <ToggleChip
                              key={c.id}
                              label={c.name}
                              active={(
                                formData as any
                              ).selectedCategoryIds?.includes(c.id)}
                              onClick={() => toggleCategory(c.id)}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyState text="No categories for selected series" />
                      )}
                    </div>
                  )}

                  {/* SubCategories */}
                  {(formData as any).selectedCategoryIds?.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                        Subcategories
                      </label>
                      {subCategoryList?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {subCategoryList.map((sc: any) => (
                            <ToggleChip
                              key={sc.id}
                              label={sc.name}
                              active={(
                                formData as any
                              ).selectedSubCategoryIds?.includes(sc.id)}
                              onClick={() => toggleSubCat(sc.id)}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyState text="No subcategories for selected categories" />
                      )}
                    </div>
                  )}

                  {/* Summary */}
                  {(formData as any).selectedSubCategoryIds?.length > 0 && (
                    <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                          <Tag className="w-3 h-3 inline mr-1" />
                          {(formData as any).selectedSubCategoryIds.length}{" "}
                          linked
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p: any) => ({
                              ...p,
                              selectedSubCategoryIds: [],
                            }))
                          }
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(formData as any).selectedSubCategoryIds.map(
                          (id: number) => {
                            const sc = subCategoryList?.find(
                              (s: any) => s.id === id,
                            );
                            const cat = categoryList?.find(
                              (c: any) => c.id === sc?.categoryId,
                            );
                            const ser = seriesList?.find(
                              (s: any) => s.id === cat?.seriesId,
                            );
                            return sc ? (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-teal-200 text-teal-700 rounded-full text-xs font-medium"
                              >
                                {ser?.name && (
                                  <span className="text-slate-400">
                                    {ser.name} →
                                  </span>
                                )}
                                {cat?.name && (
                                  <span className="text-slate-400">
                                    {cat.name} →
                                  </span>
                                )}
                                {sc.name}
                                <button
                                  type="button"
                                  onClick={() => toggleSubCat(id)}
                                  className="hover:text-red-500 transition-colors ml-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ) : null;
                          },
                        )}
                      </div>
                    </div>
                  )}

                  {!(formData as any).selectedSeriesIds?.length && (
                    <p className="text-sm text-slate-400 italic text-center py-4">
                      Select a series above to link product subcategories to
                      this post.
                    </p>
                  )}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── STEP: PUBLISH ── */}
          {activeStep === "publish" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <SectionCard
                title="Publishing Settings"
                subtitle="Control visibility"
              >
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, published: !p.published }))
                    }
                    className={`w-full flex items-center justify-between p-5 rounded-xl border-2 transition-all ${
                      formData.published
                        ? "border-teal-400 bg-teal-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-full ${formData.published ? "bg-teal-100" : "bg-slate-100"}`}
                      >
                        {formData.published ? (
                          <Eye className={`w-5 h-5 text-teal-600`} />
                        ) : (
                          <EyeOff className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="text-left">
                        <p
                          className={`font-semibold ${formData.published ? "text-teal-700" : "text-slate-700"}`}
                        >
                          {formData.published ? "Published" : "Draft"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formData.published
                            ? "Visible to all readers"
                            : "Only visible to admins"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-11 h-6 rounded-full transition-all relative ${formData.published ? "bg-teal-500" : "bg-slate-200"}`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${formData.published ? "left-5" : "left-0.5"}`}
                      />
                    </div>
                  </button>
                </div>
              </SectionCard>

              {/* Summary card */}
              <SectionCard title="Post Summary" subtitle="Review before saving">
                <div className="space-y-3">
                  {[
                    {
                      label: "Title",
                      value: formData.title || "—",
                      valid: !!formData.title,
                    },
                    {
                      label: "Slug",
                      value: formData.slug ? `/blog/${formData.slug}` : "—",
                      valid: !!formData.slug,
                      mono: true,
                    },
                    {
                      label: "Category",
                      value:
                        blogCategories?.find(
                          (c) => c.id === formData.blogCategoryId,
                        )?.name || "Not selected",
                      valid: !!formData.blogCategoryId,
                    },
                    {
                      label: "Content",
                      value: formData.content
                        ? `${formData.content.length} characters`
                        : "Empty",
                      valid: formData.content.length > 10,
                    },
                    {
                      label: "Cover image",
                      value:
                        formData.imageFile || formData.image
                          ? "Uploaded"
                          : "None",
                      valid: true,
                    },
                    {
                      label: "Linked subcategories",
                      value: `${(formData as any).selectedSubCategoryIds?.length ?? 0} selected`,
                      valid: true,
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                    >
                      <span className="text-xs text-slate-500 font-medium">
                        {row.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${row.mono ? "font-mono text-slate-500" : "text-slate-700"} max-w-[200px] truncate`}
                        >
                          {row.value}
                        </span>
                        {!row.valid && (
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={
                    submitting || !stepValid.basics || !stepValid.content
                  }
                  className="w-full mt-5 flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {submitting
                    ? isEdit
                      ? "Updating…"
                      : "Saving…"
                    : isEdit
                      ? formData.published
                        ? "Update & Publish"
                        : "Save Changes"
                      : formData.published
                        ? "Publish Post"
                        : "Save as Draft"}
                </button>
              </SectionCard>
            </div>
          )}

          {/* Step nav buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                const idx = STEPS.findIndex((s) => s.id === activeStep);
                if (idx > 0) setActiveStep(STEPS[idx - 1].id);
              }}
              disabled={activeStep === STEPS[0].id}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-0 transition-colors"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => {
                const idx = STEPS.findIndex((s) => s.id === activeStep);
                if (idx < STEPS.length - 1) setActiveStep(STEPS[idx + 1].id);
              }}
              disabled={activeStep === STEPS[STEPS.length - 1].id}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-0 transition-colors"
            >
              Next →
            </button>
          </div>
        </form>
      </div>

      {isCategoryModalOpen && (
        <CategoryModal
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={handleCreateCategory}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-sm border-2 font-medium transition-all ${
        active
          ? "border-teal-400 bg-teal-50 text-teal-700"
          : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
      }`}
    >
      {active && <span className="mr-1 text-teal-500">✓</span>}
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 italic py-2">{text}</p>;
}
