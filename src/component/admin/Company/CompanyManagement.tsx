/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CompanyInfo {
  id: number;
  name: string;
  logo: string | null;
  favicon: string | null;
  tagline: string | null;
  about: string | null;
  privacyPolicy: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  googleMapUrl: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  twitter: string | null;
  linkedin: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  metaPixelId: string | null;
  updatedAt: string;
}

type Tab = "basic" | "contact" | "social" | "seo";

// ─────────────────────────────────────────────────────────────────────────────
// Tabs config
// ─────────────────────────────────────────────────────────────────────────────
const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: "basic",
    label: "Basic Info",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 9h1m5 0h-1M9 12h6m-6 3h4" />
      </svg>
    ),
  },
  {
    key: "contact",
    label: "Contact",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    key: "social",
    label: "Social Media",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
      </svg>
    ),
  },
  {
    key: "seo",
    label: "SEO",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
        <path d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
      </svg>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Reusable field components
// ─────────────────────────────────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-slate-300 transition";

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={inputCls + " resize-none"}
    />
  );
}

function SocialField({
  label,
  icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-0 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-300 bg-white transition">
        <span className="flex items-center justify-center w-10 h-10 text-slate-400 bg-slate-50 border-r border-slate-200 shrink-0">
          {icon}
        </span>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent text-slate-700 focus:outline-none placeholder:text-slate-300"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Image upload field (Cloudinary unsigned)
// ─────────────────────────────────────────────────────────────────────────────
function ImageField({
  label,
  hint,
  value,
  onChange,
  getSignature,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  getSignature: () => Promise<{
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
  }>;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const sig = await getSignature();
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: "POST", body: form },
      );
      const data = await res.json();
      onChange(data.secure_url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
            <img
              src={value}
              alt={label}
              className="w-full h-full object-contain p-1"
            />
            <button
              onClick={() => onChange("")}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className="w-3 h-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-6 h-6 text-slate-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z"
              />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <label
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition text-slate-600 ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            {uploading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15-4.5M20 15a9 9 0 0 1-15 4.5"
                  />
                </svg>
                Uploading…
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                </svg>
                Upload image
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </label>
          {hint && <p className="text-[11px] text-slate-400 mt-1.5">{hint}</p>}
          {value && (
            <p className="text-[11px] text-slate-400 mt-1 font-mono truncate max-w-[240px]">
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEO preview
// ─────────────────────────────────────────────────────────────────────────────
function SeoPreview({
  title,
  description,
  url = "https://ondorkotha.com",
}: {
  title: string;
  description: string;
  url?: string;
}) {
  if (!title && !description) return null;
  return (
    <div className="rounded-xl border border-slate-200 p-4 bg-white">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
        Google preview
      </p>
      <div className="text-[13px] text-green-700 mb-0.5 font-mono truncate">
        {url}
      </div>
      <div className="text-[17px] text-blue-700 font-medium leading-snug truncate hover:underline cursor-pointer">
        {title || "Page title"}
      </div>
      <div className="text-[13px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
        {description || "Page description will appear here."}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function CompanyInfoComp() {
  const axiosSecure = useAxiosSecure();

  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const [data, setData] = useState<CompanyInfo | null>(null);
  const [form, setForm] = useState<Partial<CompanyInfo>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track dirty state
  const isDirty = JSON.stringify(form) !== JSON.stringify(data ?? {});

  // ── Load ───
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosSecure.get("/company");

      // console.log(res.data, "company - resdata");
      setData(res.data);
      setForm(res.data);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Field helper ──────────────────────────────────────────────────────────
  function set(field: keyof CompanyInfo, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function val(field: keyof CompanyInfo): string {
    return (form[field] as string) ?? "";
  }

  // ── Cloudinary signature ──────────────────────────────────────────────────
  async function getSignature() {
    const res = await axiosSecure.get("/cloudinary-signature");
    return res.data;
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await axiosSecure.patch("/company", form);

      console.log(res.data, "resdata - patch company");
      setData(res.data);
      setForm(res.data);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Failed to save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Discard ───────────────────────────────────────────────────────────────
  function discard() {
    if (data) setForm(data);
    setError(null);
  }

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Company Info</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your brand, contact details, and SEO settings
          </p>
        </div>

        <div className="flex items-center gap-3">
          {error && (
            <span className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
              {error}
            </span>
          )}
          {isDirty && !savedFlash && (
            <>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                Unsaved changes
              </span>
              <button
                onClick={discard}
                className="text-xs px-3 py-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                Discard
              </button>
            </>
          )}
          <button
            onClick={save}
            disabled={!isDirty || saving}
            className={`px-5 py-2 text-sm font-medium rounded-xl transition-all ${
              savedFlash
                ? "bg-emerald-500 text-white"
                : "bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            {saving ? "Saving…" : savedFlash ? "✓ Saved" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="max-w-[860px] space-y-5">
        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span
                className={
                  activeTab === tab.key ? "text-slate-600" : "text-slate-400"
                }
              >
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Basic Info ── */}
        {activeTab === "basic" && (
          <div className="space-y-5">
            <Section
              title="Brand identity"
              description="Your company name and visual assets"
            >
              <div className="grid grid-cols-2 gap-5">
                <Field label="Company name">
                  <Input
                    value={val("name")}
                    onChange={(v) => set("name", v)}
                    placeholder="Ondorkotha"
                  />
                </Field>
                <Field label="Tagline">
                  <Input
                    value={val("tagline")}
                    onChange={(v) => set("tagline", v)}
                    placeholder="Your brand tagline"
                  />
                </Field>
              </div>

              <Field
                label="Logo"
                hint="Recommended: PNG with transparent background, min 200×200px"
              >
                <ImageField
                  label=""
                  value={val("logo")}
                  onChange={(v) => set("logo", v)}
                  getSignature={getSignature}
                  hint="Displayed in admin nav and storefront header"
                />
              </Field>

              <Field
                label="Favicon"
                hint="Recommended: 32×32px or 64×64px square PNG/ICO"
              >
                <ImageField
                  label=""
                  value={val("favicon")}
                  onChange={(v) => set("favicon", v)}
                  getSignature={getSignature}
                  hint="Shown in browser tab"
                />
              </Field>
            </Section>

            <Section
              title="About"
              description="A short description of your company"
            >
              <Field
                label="About text"
                hint="Shown on your About page and in search results"
              >
                <Textarea
                  value={val("about")}
                  onChange={(v) => set("about", v)}
                  placeholder="Tell your brand story…"
                  rows={5}
                />
              </Field>
            </Section>
          </div>
        )}

        {/* ── Contact ── */}
        {activeTab === "contact" && (
          <div className="space-y-5">
            <Section
              title="Contact details"
              description="How customers can reach you"
            >
              <div className="grid grid-cols-2 gap-5">
                <Field label="Email">
                  <Input
                    value={val("email")}
                    onChange={(v) => set("email", v)}
                    placeholder="hello@ondorkotha.com"
                    type="email"
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={val("phone")}
                    onChange={(v) => set("phone", v)}
                    placeholder="+880 1xxx-xxxxxx"
                  />
                </Field>
                <Field label="WhatsApp">
                  <Input
                    value={val("whatsapp")}
                    onChange={(v) => set("whatsapp", v)}
                    placeholder="+880 1xxx-xxxxxx"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Address" description="Your physical location">
              <Field label="Street address">
                <Input
                  value={val("address")}
                  onChange={(v) => set("address", v)}
                  placeholder="123 Main Street"
                />
              </Field>
              <div className="grid grid-cols-2 gap-5">
                <Field label="City">
                  <Input
                    value={val("city")}
                    onChange={(v) => set("city", v)}
                    placeholder="Dhaka"
                  />
                </Field>
                <Field label="Country">
                  <Input
                    value={val("country")}
                    onChange={(v) => set("country", v)}
                    placeholder="Bangladesh"
                  />
                </Field>
              </div>
              <Field
                label="Google Maps URL"
                hint="Paste the share link from Google Maps"
              >
                <Input
                  value={val("googleMapUrl")}
                  onChange={(v) => set("googleMapUrl", v)}
                  placeholder="https://maps.google.com/..."
                />
              </Field>
            </Section>
          </div>
        )}

        {/* ── Social ── */}
        {activeTab === "social" && (
          <Section
            title="Social media"
            description="Links to your social profiles"
          >
            <SocialField
              label="Facebook"
              value={val("facebook")}
              onChange={(v) => set("facebook", v)}
              placeholder="https://facebook.com/ondorkotha"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              }
            />
            <SocialField
              label="Instagram"
              value={val("instagram")}
              onChange={(v) => set("instagram", v)}
              placeholder="https://instagram.com/ondorkotha"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              }
            />
            <SocialField
              label="YouTube"
              value={val("youtube")}
              onChange={(v) => set("youtube", v)}
              placeholder="https://youtube.com/@ondorkotha"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                  <path d="m10 15 5-3-5-3z" />
                </svg>
              }
            />
            <SocialField
              label="TikTok"
              value={val("tiktok")}
              onChange={(v) => set("tiktok", v)}
              placeholder="https://tiktok.com/@ondorkotha"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.02-.07z" />
                </svg>
              }
            />
            <SocialField
              label="X / Twitter"
              value={val("twitter")}
              onChange={(v) => set("twitter", v)}
              placeholder="https://x.com/ondorkotha"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              }
            />
            <SocialField
              label="LinkedIn"
              value={val("linkedin")}
              onChange={(v) => set("linkedin", v)}
              placeholder="https://linkedin.com/company/ondorkotha"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              }
            />
          </Section>
        )}

        {/* ── SEO ── */}
        {activeTab === "seo" && (
          <div className="space-y-5">
            <Section
              title="Search engine optimization"
              description="Controls how your site appears in Google and other search engines"
            >
              <Field
                label="Meta title"
                hint={`${val("metaTitle").length}/60 characters — keep under 60 for best display`}
              >
                <Input
                  value={val("metaTitle")}
                  onChange={(v) => set("metaTitle", v)}
                  placeholder="Ondorkotha — Your brand tagline"
                />
              </Field>

              <Field
                label="Meta description"
                hint={`${val("metaDescription").length}/160 characters — keep under 160 for best display`}
              >
                <Textarea
                  value={val("metaDescription")}
                  onChange={(v) => set("metaDescription", v)}
                  placeholder="A short summary of what Ondorkotha offers…"
                  rows={3}
                />
              </Field>

              <SeoPreview
                title={val("metaTitle")}
                description={val("metaDescription")}
              />
            </Section>

            <Section
              title="Open Graph"
              description="Controls how your site appears when shared on social media"
            >
              <Field
                label="OG Image"
                hint="Recommended: 1200×630px — shown when sharing links on Facebook, WhatsApp, etc."
              >
                <ImageField
                  label=""
                  value={val("ogImage")}
                  onChange={(v) => set("ogImage", v)}
                  getSignature={getSignature}
                  hint="1200×630px recommended"
                />
              </Field>

              {/* OG preview */}
              {val("ogImage") && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <img
                    src={val("ogImage")}
                    alt="OG preview"
                    className="w-full h-48 object-cover"
                  />
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">
                      ondorkotha.com
                    </p>
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {val("metaTitle") || "Page title"}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {val("metaDescription") || "Page description"}
                    </p>
                  </div>
                </div>
              )}
            </Section>

            <Section
              title="Tracking & analytics"
              description="Injected site-wide once set — leave blank to skip"
            >
              <Field
                label="Meta Pixel ID"
                hint="From Meta Events Manager — enables Facebook/Instagram ad conversion tracking"
              >
                <Input
                  value={val("metaPixelId")}
                  onChange={(v) => set("metaPixelId", v)}
                  placeholder="123456789012345"
                />
              </Field>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
