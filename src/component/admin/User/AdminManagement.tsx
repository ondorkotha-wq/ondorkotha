/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type AdminRole =
  | "SUPERADMIN"
  | "PRODUCTMANAGER"
  | "ORDERMANAGER"
  | "INVENTORYMANAGER"
  | "SUPPORT";

interface AdminUser {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
}

interface InviteForm {
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_ROLES: {
  key: AdminRole;
  label: string;
  color: string;
  bg: string;
  dot: string;
  description: string;
}[] = [
  {
    key: "SUPERADMIN",
    label: "Super Admin",
    color: "text-violet-700",
    bg: "bg-violet-50 border-violet-200",
    dot: "bg-violet-500",
    description: "Full system access",
  },
  {
    key: "PRODUCTMANAGER",
    label: "Product Manager",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    description: "Manage products & inventory",
  },
  {
    key: "ORDERMANAGER",
    label: "Order Manager",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    description: "Manage orders & shipping",
  },
  {
    key: "INVENTORYMANAGER",
    label: "Inventory Manager",
    color: "text-teal-700",
    bg: "bg-teal-50 border-teal-200",
    dot: "bg-teal-500",
    description: "Receive stock, assign locations, process returns",
  },
  {
    key: "SUPPORT",
    label: "Support",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    description: "Customer support access",
  },
];

function getRoleMeta(role: AdminRole) {
  return ADMIN_ROLES.find((r) => r.key === role) ?? ADMIN_ROLES[0];
}

function getInitials(name: string | null, email: string | null): string {
  if (name)
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const IconX = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const IconChevronDown = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-3 h-3"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const IconSpinner = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-3 h-3 animate-spin"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15-4.5M20 15a9 9 0 0 1-15 4.5"
    />
  </svg>
);

const IconCheck = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    className="w-3 h-3"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const IconDots = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-4 h-4"
  >
    <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconWarning = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);

const IconOTP = () => (
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
      d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
    />
  </svg>
);

const IconDeactivate = ({ active }: { active: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    className="w-4 h-4"
  >
    {active ? (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
      />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    )}
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Small components
// ─────────────────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: AdminRole }) {
  const meta = getRoleMeta(role);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.bg} ${meta.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${active ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-slate-300 transition"
      />
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Superadmin Warning Modal
// ─────────────────────────────────────────────────────────────────────────────
function SuperAdminWarningModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-red-100">
        {/* Warning header */}
        <div className="bg-red-50 px-6 py-5 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <IconWarning />
            </div>
            <div>
              <h2 className="text-sm font-bold text-red-800">
                Super Admin Warning
              </h2>
              <p className="text-xs text-red-500 mt-0.5">
                This action grants unrestricted access
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <ul className="space-y-2">
            {[
              "Full access to all admin features and data",
              "Can create, modify, and delete other admins",
              "Cannot be restricted or limited later",
              "This action is logged and audited",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-xs text-slate-600"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setConfirmed((p) => !p)}
              className={`w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${confirmed ? "bg-red-600 border-red-600" : "border-slate-300 group-hover:border-red-400"}`}
            >
              {confirmed && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth={3}
                  className="w-2.5 h-2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span className="text-xs text-slate-600 leading-relaxed">
              I understand the risks and confirm this user should have{" "}
              <strong>Super Admin</strong> access.
            </span>
          </label>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed}
            className="px-5 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Create Super Admin
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Invite Modal
// ─────────────────────────────────────────────────────────────────────────────
function InviteModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const axiosSecure = useAxiosSecure();
  const [form, setForm] = useState<InviteForm>({
    name: "",
    email: "",
    phone: "",
    role: "PRODUCTMANAGER",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuperAdminWarning, setShowSuperAdminWarning] = useState(false);

  const set = (field: keyof InviteForm, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  async function doCreate() {
    setSaving(true);
    setError(null);
    try {
      await axiosSecure.post("/admin/users", form);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function submit() {
    if (!form.email || !form.role) {
      setError("Email and role are required.");
      return;
    }
    // Show warning before creating superadmin
    if (form.role === "SUPERADMIN") {
      setShowSuperAdminWarning(true);
      return;
    }
    await doCreate();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Create admin user
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                User will receive an OTP to log in — no password required
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400"
            >
              <IconX />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Full name"
                value={form.name}
                onChange={(v) => set("name", v)}
                placeholder="Jane Doe"
              />
              <Field
                label="Phone"
                value={form.phone}
                onChange={(v) => set("phone", v)}
                placeholder="+880..."
              />
            </div>

            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              placeholder="jane@example.com"
              required
              hint="OTP will be sent to this email for login"
            />

            {/* Role selector */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Role <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ADMIN_ROLES.map((r) => {
                  const isSelected = form.role === r.key;
                  const isSuperAdmin = r.key === "SUPERADMIN";
                  return (
                    <button
                      key={r.key}
                      onClick={() => set("role", r.key)}
                      className={`flex items-start gap-2.5 px-3 py-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? `${r.bg} ${r.color} ring-2 ring-offset-1 ${isSuperAdmin ? "ring-red-400" : "ring-violet-300"} font-semibold`
                          : isSuperAdmin
                            ? "border-red-200 bg-red-50/50 text-slate-600 hover:border-red-300"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 mt-1 ${r.dot}`}
                      />
                      <div>
                        <p className="text-xs font-semibold leading-tight">
                          {r.label}
                        </p>
                        <p
                          className={`text-[10px] mt-0.5 font-normal ${isSelected ? "opacity-70" : "text-slate-400"}`}
                        >
                          {r.description}
                        </p>
                        {isSuperAdmin && (
                          <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                            ⚠ Requires confirmation
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className={`px-5 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-2 ${
                form.role === "SUPERADMIN"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              {saving && <IconSpinner />}
              {saving
                ? "Creating…"
                : form.role === "SUPERADMIN"
                  ? "⚠ Create Super Admin"
                  : "Create user"}
            </button>
          </div>
        </div>
      </div>

      {/* Super admin warning overlay */}
      {showSuperAdminWarning && (
        <SuperAdminWarningModal
          onConfirm={async () => {
            setShowSuperAdminWarning(false);
            await doCreate();
          }}
          onCancel={() => setShowSuperAdminWarning(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete User Modal
// ─────────────────────────────────────────────────────────────────────────────
function DeleteUserModal({
  user,
  onConfirm,
  onClose,
}: {
  user: AdminUser;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const confirmValue = user.name ?? user.email ?? "";
  const isMatch = input.trim() === confirmValue.trim();

  async function handle() {
    if (!isMatch) return;
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-red-100">
        {/* Header */}
        <div className="bg-red-50 px-6 py-5 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-red-800">
                Delete user permanently
              </h2>
              <p className="text-xs text-red-500 mt-0.5">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* User preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(user.id)}`}
            >
              {getInitials(user.name, user.email)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {user.name ?? (
                  <span className="italic text-slate-400">No name</span>
                )}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user.email ?? user.phone ?? "—"}
              </p>
            </div>
            <RoleBadge role={user.role} />
          </div>

          {/* Consequences */}
          <ul className="space-y-1.5">
            {[
              "Account and all associated data will be deleted",
              "User will immediately lose admin access",
              "This cannot be recovered",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-xs text-slate-500"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          {/* Confirmation input */}
          <div>
            <p className="text-xs text-slate-500 mb-2">
              Type{" "}
              <strong className="text-slate-700 font-semibold select-all">
                {confirmValue}
              </strong>{" "}
              to confirm:
            </p>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={(e) => e.preventDefault()} // force manual typing
              placeholder={confirmValue}
              autoFocus
              className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 placeholder:text-slate-300 transition ${
                input && !isMatch
                  ? "border-red-300 focus:ring-red-200"
                  : input && isMatch
                    ? "border-emerald-300 focus:ring-emerald-200"
                    : "border-slate-200 focus:ring-red-200"
              }`}
            />
            {input && !isMatch && (
              <p className="text-[10px] text-red-500 mt-1">
                Doesn't match — check spelling and spacing
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={!isMatch || loading}
            className="px-5 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading && <IconSpinner />}
            {loading ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Change Dropdown (inline)
// ─────────────────────────────────────────────────────────────────────────────
function RoleDropdown({
  user,
  onUpdate,
}: {
  user: AdminUser;
  onUpdate: (id: number, role: AdminRole) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function pick(role: AdminRole) {
    if (role === user.role) return setOpen(false);
    setLoading(true);
    setOpen(false);
    await onUpdate(user.id, role);
    setLoading(false);
  }

  // Superadmin role is not editable inline
  if (user.role === "SUPERADMIN") return <RoleBadge role={user.role} />;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className="flex items-center gap-1.5 group"
      >
        <RoleBadge role={user.role} />
        <span className="text-slate-300 group-hover:text-slate-500 transition">
          {loading ? <IconSpinner /> : <IconChevronDown />}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[180px]">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Change role
              </p>
            </div>
            {ADMIN_ROLES.filter((r) => r.key !== "SUPERADMIN").map((r) => (
              <button
                key={r.key}
                onClick={() => pick(r.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition hover:bg-slate-50 ${
                  r.key === user.role
                    ? `${r.color} font-semibold bg-slate-50`
                    : "text-slate-600"
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${r.dot}`} />
                {r.label}
                {r.key === user.role && (
                  <span className="ml-auto">
                    <IconCheck />
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm modal
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmModal({
  title,
  description,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 py-5">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={loading}
            className={`px-5 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-2 ${
              danger
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-slate-800 text-white hover:bg-slate-700"
            }`}
          >
            {loading && <IconSpinner />}
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row action menu
// ─────────────────────────────────────────────────────────────────────────────
function ActionMenu({
  user,
  onDeactivate,
  onDelete,
  onResendOtp,
}: {
  user: AdminUser;
  onDeactivate: () => void;
  onResendOtp: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (user.role === "SUPERADMIN") return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
      >
        <IconDots />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-50">
            {/* <button
              onClick={() => {
                setOpen(false);
                onResendOtp();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              <IconOTP />
              Resend login OTP
            </button> */}
            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
            >
              Delete user
            </button>
            <div className="border-t border-slate-100" />
            <button
              onClick={() => {
                setOpen(false);
                onDeactivate();
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${
                user.isActive
                  ? "text-red-600 hover:bg-red-50"
                  : "text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              <IconDeactivate active={user.isActive} />
              {user.isActive ? "Deactivate user" : "Reactivate user"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminUsersComponent() {
  const axiosSecure = useAxiosSecure();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminRole | "ALL">("ALL");
  const [showInvite, setShowInvite] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(
    null,
  );
  const [otpTarget, setOtpTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosSecure.get("/admin/users");
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Actions ───────────────────────────────────────────────────────────────
  async function changeRole(id: number, role: AdminRole) {
    await axiosSecure.patch(`/admin/users/${id}/role`, { role });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  }

  function getErrorMessage(error: any): string {
    if (error?.response?.data) {
      const data = error.response.data;

      if (typeof data.message === "string") return data.message;

      if (Array.isArray(data.message)) return data.message[0];

      return "Request failed. Try again.";
    }

    if (error?.message) return error.message;

    return "Something went wrong.";
  }

  async function deleteUser(user: AdminUser) {
    try {
      await axiosSecure.delete(`/admin/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e) {
      toast.error(getErrorMessage(e)); 
    }
  }

  async function toggleActive(user: AdminUser) {
    await axiosSecure.patch(`/admin/users/${user.id}/status`, {
      isActive: !user.isActive,
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)),
    );
  }

  async function resendOtp(user: AdminUser) {
    await axiosSecure.post(`/admin/users/${user.id}/resend-otp`);
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = ADMIN_ROLES.map((r) => ({
    ...r,
    count: users.filter((u) => u.role === r.key).length,
    activeCount: users.filter((u) => u.role === r.key && u.isActive).length,
  }));

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Admin Users</h1>
          <p className="text-sm text-slate-400 mt-1">
            {users.length} total · {users.filter((u) => u.isActive).length}{" "}
            active
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Create user
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-5">
        {/* ── Role stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((r) => (
            <button
              key={r.key}
              onClick={() =>
                setRoleFilter((prev) => (prev === r.key ? "ALL" : r.key))
              }
              className={`rounded-xl border p-4 text-left transition-all shadow-sm hover:shadow-md ${
                roleFilter === r.key
                  ? r.bg + " ring-2 ring-offset-1 ring-violet-400"
                  : "bg-white border-slate-100"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`w-2 h-2 rounded-full ${r.dot}`} />
                {r.count > 0 && r.activeCount < r.count && (
                  <span className="text-[9px] text-slate-400">
                    {r.count - r.activeCount} inactive
                  </span>
                )}
              </div>
              <p
                className={`text-2xl font-bold ${roleFilter === r.key ? r.color : "text-slate-700"}`}
              >
                {r.count}
              </p>
              <p
                className={`text-[11px] font-semibold mt-1 ${roleFilter === r.key ? r.color : "text-slate-500"}`}
              >
                {r.label}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {r.description}
              </p>
            </button>
          ))}
        </div>

        {/* ── Search + filter ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 shadow-sm transition"
            />
          </div>
          {roleFilter !== "ALL" && (
            <button
              onClick={() => setRoleFilter("ALL")}
              className="text-xs px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition flex items-center gap-1.5"
            >
              <IconX />
              Clear filter
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-3">Loading users…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-slate-400 text-sm">No users found.</p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-xs text-violet-500 mt-2 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm mb-10">
                <thead className="bg-slate-50/60 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      User
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Role
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Joined
                    </th>
                    <th className="px-5 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* User info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(user.id)}`}
                          >
                            {getInitials(user.name, user.email)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-[13px] leading-tight">
                              {user.name ?? (
                                <span className="text-slate-400 italic">
                                  No name
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {user.email ?? user.phone ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <RoleDropdown user={user} onUpdate={changeRole} />
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <StatusBadge active={user.isActive} />
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-3.5 text-[12px] text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <ActionMenu
                          user={user}
                          onDeactivate={() => setDeactivateTarget(user)}
                          onResendOtp={() => setOtpTarget(user)}
                          onDelete={() => setDeleteTarget(user)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onSuccess={load} />
      )}

      {deactivateTarget && (
        <ConfirmModal
          title={
            deactivateTarget.isActive ? "Deactivate user" : "Reactivate user"
          }
          description={
            deactivateTarget.isActive
              ? `${deactivateTarget.name ?? deactivateTarget.email} will lose access to the admin panel immediately.`
              : `${deactivateTarget.name ?? deactivateTarget.email} will regain access to the admin panel.`
          }
          confirmLabel={deactivateTarget.isActive ? "Deactivate" : "Reactivate"}
          danger={deactivateTarget.isActive}
          onConfirm={() => toggleActive(deactivateTarget)}
          onClose={() => setDeactivateTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onConfirm={() => deleteUser(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {otpTarget && (
        <ConfirmModal
          title="Resend login OTP"
          description={`A new OTP will be sent to ${otpTarget.email ?? otpTarget.phone ?? "this user"} so they can log in.`}
          confirmLabel="Send OTP"
          onConfirm={() => resendOtp(otpTarget)}
          onClose={() => setOtpTarget(null)}
        />
      )}
    </div>
  );
}
