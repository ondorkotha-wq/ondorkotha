/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, useMemo, FC } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import {
  Edit3,
  Save,
  Trash2,
  X,
  Plus,
  Tag,
  Percent,
  DollarSign,
  Truck,
  Copy,
  Check,
  Calendar,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingDots from "@/component/Loading/LoadingDS";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { DeleteConfirmationModal } from "../Modal/DeleteConfirmationModal";
import useFetchCoupons from "@/hooks/Promotion/useFetchCoupons";
import useFetchCategories from "@/hooks/Categories/Categories/useFetchCategories";
import { useHasPermission } from "@/context/PermissionsContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type CouponDiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_DELIVERY";

interface CouponCategory {
  categoryId: number;
  category?: { id: number; name: string | null };
}

interface Coupon {
  id: number;
  code: string;
  discountType: CouponDiscountType;
  discountValue?: number | null;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  expiryDate: string;
  startDate: string;
  isActive: boolean;
  usageLimit?: number | null;
  usedCount?: number;
  perUserLimit?: number | null;
  categories?: CouponCategory[];
  createdAt?: string;
  updatedAt?: string;
}

interface CouponFormData {
  code: string;
  discountType: CouponDiscountType;
  discountValue: string;
  minOrderValue: string;
  maxDiscount: string;
  expiryDate: string;
  startDate: string;
  isActive: boolean;
  usageLimit: string;
  perUserLimit: string;
  categoryIds: number[];
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDateInputValue = (iso: string) => iso?.slice(0, 10) ?? "";

const DEFAULT_FORM: CouponFormData = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderValue: "",
  maxDiscount: "",
  expiryDate: "",
  startDate: new Date().toISOString().slice(0, 10),
  isActive: true,
  usageLimit: "",
  perUserLimit: "",
  categoryIds: [],
};

const DISCOUNT_TYPE_OPTIONS: {
  value: CouponDiscountType;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "PERCENTAGE",
    label: "Percentage",
    icon: <Percent size={14} />,
    color: "text-violet-600 bg-violet-50",
  },
  {
    value: "FIXED_AMOUNT",
    label: "Fixed Amount",
    icon: <DollarSign size={14} />,
    color: "text-amber-600 bg-amber-50",
  },
  {
    value: "FREE_DELIVERY",
    label: "Free Delivery",
    icon: <Truck size={14} />,
    color: "text-sky-600 bg-sky-50",
  },
];

function getDiscountTypeStyle(type: CouponDiscountType) {
  return (
    DISCOUNT_TYPE_OPTIONS.find((o) => o.value === type) ??
    DISCOUNT_TYPE_OPTIONS[0]
  );
}

function formatDiscountValue(coupon: Coupon): string {
  if (coupon.discountType === "FREE_DELIVERY") return "Free delivery";
  if (coupon.discountType === "PERCENTAGE")
    return coupon.discountValue != null ? `${coupon.discountValue}%` : "—";
  if (coupon.discountType === "FIXED_AMOUNT")
    return coupon.discountValue != null ? `$${coupon.discountValue}` : "—";
  return "—";
}

function isExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

function isNotStarted(startDate: string): boolean {
  return new Date(startDate) > new Date();
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AllCouponsComp: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const { coupons, isLoading, refetch } = useFetchCoupons();
  const { categoryList } = useFetchCategories({ isActive: true });
  const canCreate = useHasPermission("COUPON_CREATE");
  const canUpdate = useHasPermission("COUPON_UPDATE");
  const canDelete = useHasPermission("COUPON_DELETE");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(DEFAULT_FORM);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim())
      errors.code = "Coupon code is required";
    else if (!/^[A-Z0-9_-]{3,20}$/i.test(formData.code.trim()))
      errors.code = "Code must be 3–20 alphanumeric characters";

    if (
      formData.discountType !== "FREE_DELIVERY" &&
      (!formData.discountValue || isNaN(Number(formData.discountValue)))
    )
      errors.discountValue = "A valid discount value is required";

    if (
      formData.discountType === "PERCENTAGE" &&
      (Number(formData.discountValue) <= 0 ||
        Number(formData.discountValue) > 100)
    )
      errors.discountValue = "Percentage must be between 1 and 100";

    if (!formData.expiryDate) errors.expiryDate = "Expiry date is required";
    else if (new Date(formData.expiryDate) <= new Date(formData.startDate))
      errors.expiryDate = "Expiry date must be after start date";

    if (
      formData.usageLimit &&
      (!Number.isInteger(Number(formData.usageLimit)) ||
        Number(formData.usageLimit) <= 0)
    )
      errors.usageLimit = "Must be a whole number greater than 0";

    if (
      formData.perUserLimit &&
      (!Number.isInteger(Number(formData.perUserLimit)) ||
        Number(formData.perUserLimit) <= 0)
    )
      errors.perUserLimit = "Must be a whole number greater than 0";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const isFormValid = useMemo(() => {
    if (!formData.code.trim()) return false;
    if (
      formData.discountType !== "FREE_DELIVERY" &&
      !formData.discountValue
    )
      return false;
    if (!formData.expiryDate) return false;
    return true;
  }, [formData]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM);
    setValidationErrors({});
  }, []);

  const handleInputChange = useCallback(
    (field: keyof CouponFormData, value: any) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        // clear discountValue when switching to FREE_DELIVERY
        if (field === "discountType" && value === "FREE_DELIVERY")
          next.discountValue = "";
        return next;
      });
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    },
    []
  );

  const handleEdit = useCallback((coupon: Coupon) => {
    setEditingId(coupon.id);
    setIsAdding(false);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue?.toString() ?? "",
      minOrderValue: coupon.minOrderValue?.toString() ?? "",
      maxDiscount: coupon.maxDiscount?.toString() ?? "",
      expiryDate: toDateInputValue(coupon.expiryDate),
      startDate: toDateInputValue(coupon.startDate),
      isActive: coupon.isActive,
      usageLimit: coupon.usageLimit?.toString() ?? "",
      perUserLimit: coupon.perUserLimit?.toString() ?? "",
      categoryIds: coupon.categories?.map((c) => c.categoryId) ?? [],
    });
    setValidationErrors({});
  }, []);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  }, [resetForm]);

  const handleAddNew = useCallback(() => {
    setIsAdding(true);
    setEditingId(null);
    resetForm();
  }, [resetForm]);

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    });
  }, []);

  // ── API calls ────────────────────────────────────────────────────────────────

  const savePayload = (data: CouponFormData) => ({
    code: data.code.toUpperCase().trim(),
    discountType: data.discountType,
    discountValue:
      data.discountType === "FREE_DELIVERY"
        ? null
        : Number(data.discountValue),
    minOrderValue: data.minOrderValue ? Number(data.minOrderValue) : null,
    maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
    expiryDate: new Date(data.expiryDate).toISOString(),
    startDate: new Date(data.startDate).toISOString(),
    isActive: data.isActive,
    usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
    perUserLimit: data.perUserLimit ? Number(data.perUserLimit) : null,
    categoryIds: data.categoryIds,
  });

  const saveCoupon = useCallback(
    async (id?: number) => {
      if (!validateForm()) {
        toast.error("Please fix validation errors");
        return;
      }
      setIsSaving(true);
      try {
        if (id) {
          await axiosSecure.patch(`/coupons/${id}`, savePayload(formData));
          toast.success("Coupon updated successfully");
          setEditingId(null);
        } else {
          await axiosSecure.post("/create-coupon", savePayload(formData));
          toast.success("Coupon created successfully");
          setIsAdding(false);
        }
        resetForm();
        await refetch();
      } catch (error: any) {
        const apiError = error as ApiError;
        toast.error(apiError?.response?.data?.message || "Operation failed");
      } finally {
        setIsSaving(false);
      }
    },
    [axiosSecure, formData, refetch, resetForm, validateForm]
  );

  const toggleStatus = useCallback(
    async (coupon: Coupon) => {
      try {
        await axiosSecure.patch(`/coupons/${coupon.id}`, {
          isActive: !coupon.isActive,
        });
        toast.success(
          `${coupon.code} is now ${!coupon.isActive ? "Active" : "Inactive"}`
        );
        await refetch();
      } catch {
        toast.error("Failed to update status");
      }
    },
    [axiosSecure, refetch]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await axiosSecure.delete(`/coupons/${deleteId}`);
      toast.success("Coupon deleted successfully");
      setDeleteId(null);
      await refetch();
    } catch (error: any) {
      const apiError = error as ApiError;
      toast.error(apiError?.response?.data?.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }, [axiosSecure, deleteId, refetch]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-gray-200 bg-gray-50/50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Tag size={20} className="text-indigo-600" />
            Promo Codes
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage promotional coupon codes
          </p>
        </div>
        {!isAdding && canCreate && (
          <button
            disabled={editingId !== null}
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Add Coupon
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Code", "Discount", "Conditions", "Validity", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap last:text-right"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {/* ── Add Row ── */}
            {isAdding && (
              <tr className="bg-indigo-50/40">
                <td className="px-5 py-4 align-top">
                  <CouponCodeInput
                    value={formData.code}
                    onChange={(v) => handleInputChange("code", v)}
                    error={validationErrors.code}
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <DiscountFields
                    formData={formData}
                    onChange={handleInputChange}
                    errors={validationErrors}
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <ConditionFields
                    formData={formData}
                    onChange={handleInputChange}
                    errors={validationErrors}
                    categoryList={categoryList}
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <ValidityFields
                    formData={formData}
                    onChange={handleInputChange}
                    errors={validationErrors}
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <ActiveToggle
                    isActive={formData.isActive}
                    onChange={(v) => handleInputChange("isActive", v)}
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => saveCoupon()}
                      disabled={!isFormValid || isSaving}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* ── Existing Rows ── */}
            {coupons?.map((coupon: Coupon) => {
              const isEditing = editingId === coupon.id;
              const expired = isExpired(coupon.expiryDate);
              const notStarted = isNotStarted(coupon.startDate);
              const typeStyle = getDiscountTypeStyle(coupon.discountType);

              return (
                <tr
                  key={coupon.id}
                  className={`hover:bg-gray-50 transition-colors ${expired ? "opacity-60" : ""}`}
                >
                  {/* Code */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <CouponCodeInput
                        value={formData.code}
                        onChange={(v) => handleInputChange("code", v)}
                        error={validationErrors.code}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md tracking-wide">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Copy code"
                        >
                          {copiedCode === coupon.code ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Discount */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <DiscountFields
                        formData={formData}
                        onChange={handleInputChange}
                        errors={validationErrors}
                      />
                    ) : (
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle.color}`}
                        >
                          {typeStyle.icon}
                          {typeStyle.label}
                        </span>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatDiscountValue(coupon)}
                        </div>
                        {coupon.maxDiscount && (
                          <div className="text-xs text-gray-400">
                            Max: ${coupon.maxDiscount}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Conditions */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <ConditionFields
                        formData={formData}
                        onChange={handleInputChange}
                        errors={validationErrors}
                        categoryList={categoryList}
                      />
                    ) : (
                      <div className="text-sm text-gray-600 space-y-1 min-w-35">
                        {coupon.minOrderValue ? (
                          <div>
                            Min order:{" "}
                            <span className="font-medium text-gray-900">
                              ${coupon.minOrderValue}
                            </span>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-xs italic">No minimum</div>
                        )}
                        <div className="text-xs text-gray-500">
                          Used: {coupon.usedCount ?? 0}
                          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " (unlimited)"}
                        </div>
                        {coupon.perUserLimit ? (
                          <div className="text-xs text-gray-500">
                            Max {coupon.perUserLimit} per customer
                          </div>
                        ) : null}
                        {coupon.categories && coupon.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {coupon.categories.map((c) => (
                              <span
                                key={c.categoryId}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700"
                              >
                                {c.category?.name ?? `#${c.categoryId}`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 italic">All categories</div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Validity */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <ValidityFields
                        formData={formData}
                        onChange={handleInputChange}
                        errors={validationErrors}
                      />
                    ) : (
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>
                            {new Date(coupon.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">→</span>
                          <span
                            className={expired ? "text-red-500 font-medium" : ""}
                          >
                            {new Date(coupon.expiryDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {expired && (
                          <span className="inline-block text-xs text-red-500 font-semibold">
                            Expired
                          </span>
                        )}
                        {notStarted && !expired && (
                          <span className="inline-block text-xs text-amber-500 font-semibold">
                            Scheduled
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <ActiveToggle
                        isActive={formData.isActive}
                        onChange={(v) => handleInputChange("isActive", v)}
                      />
                    ) : (
                      <StatusBadge
                        isActive={coupon.isActive}
                        onToggle={canUpdate ? () => toggleStatus(coupon) : undefined}
                      />
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveCoupon(coupon.id)}
                          disabled={!isFormValid || isSaving}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Save"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit coupon"
                          >
                            <Edit3 size={18} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(coupon.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {coupons?.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <Tag size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No promo codes yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Create your first coupon to start offering discounts
          </p>
          {canCreate && (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
              Add Coupon
            </button>
          )}
        </div>
      )}

      {/* Delete Modal */}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputClass = (error?: string) =>
  `block w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
    error ? "border-red-500" : "border-gray-300"
  }`;

// Coupon Code Input
interface CouponCodeInputProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}
const CouponCodeInput: FC<CouponCodeInputProps> = ({ value, onChange, error }) => (
  <div className="space-y-1 min-w-32.5">
    <input
      type="text"
      placeholder="e.g. SAVE20"
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      className={`${inputClass(error)} font-mono font-semibold tracking-wide uppercase`}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// Discount Type + Value
interface DiscountFieldsProps {
  formData: CouponFormData;
  onChange: (field: keyof CouponFormData, value: any) => void;
  errors: Record<string, string>;
}
const DiscountFields: FC<DiscountFieldsProps> = ({ formData, onChange, errors }) => (
  <div className="space-y-2 min-w-[160px]">
    {/* Type selector */}
    <div className="relative">
      <select
        value={formData.discountType}
        onChange={(e) => onChange("discountType", e.target.value)}
        className="block w-full text-sm border border-gray-300 rounded-lg px-3 py-2 pr-8 appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
      >
        {DISCOUNT_TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>

    {/* Value input — hidden for FREE_DELIVERY */}
    {formData.discountType !== "FREE_DELIVERY" && (
      <div className="space-y-1">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {formData.discountType === "PERCENTAGE" ? "%" : "$"}
          </span>
          <input
            type="number"
            min={0}
            max={formData.discountType === "PERCENTAGE" ? 100 : undefined}
            step={0.01}
            placeholder={formData.discountType === "PERCENTAGE" ? "10" : "5.00"}
            value={formData.discountValue}
            onChange={(e) => onChange("discountValue", e.target.value)}
            className={`${inputClass(errors.discountValue)} pl-7`}
          />
        </div>
        {errors.discountValue && (
          <p className="text-xs text-red-600">{errors.discountValue}</p>
        )}
      </div>
    )}

    {/* Max discount — only for PERCENTAGE */}
    {formData.discountType === "PERCENTAGE" && (
      <input
        type="number"
        min={0}
        step={0.01}
        placeholder="Max discount ($)"
        value={formData.maxDiscount}
        onChange={(e) => onChange("maxDiscount", e.target.value)}
        className={inputClass()}
      />
    )}
  </div>
);

// Min Order Value, usage limits, and category eligibility
interface ConditionFieldsProps {
  formData: CouponFormData;
  onChange: (field: keyof CouponFormData, value: any) => void;
  errors?: Record<string, string>;
  categoryList?: { id: number; name: string }[];
}
const ConditionFields: FC<ConditionFieldsProps> = ({
  formData,
  onChange,
  errors = {},
  categoryList = [],
}) => {
  const toggleCategory = (id: number) => {
    const next = formData.categoryIds.includes(id)
      ? formData.categoryIds.filter((c) => c !== id)
      : [...formData.categoryIds, id];
    onChange("categoryIds", next);
  };

  return (
    <div className="space-y-2 min-w-40">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          $
        </span>
        <input
          type="number"
          min={0}
          step={0.01}
          placeholder="Min order"
          value={formData.minOrderValue}
          onChange={(e) => onChange("minOrderValue", e.target.value)}
          className={`${inputClass()} pl-7`}
        />
      </div>

      <div>
        <input
          type="number"
          min={1}
          step={1}
          placeholder="Total usage limit"
          value={formData.usageLimit}
          onChange={(e) => onChange("usageLimit", e.target.value)}
          className={inputClass(errors.usageLimit)}
        />
        {errors.usageLimit && (
          <p className="text-xs text-red-600">{errors.usageLimit}</p>
        )}
      </div>

      <div>
        <input
          type="number"
          min={1}
          step={1}
          placeholder="Uses per customer"
          value={formData.perUserLimit}
          onChange={(e) => onChange("perUserLimit", e.target.value)}
          className={inputClass(errors.perUserLimit)}
        />
        {errors.perUserLimit && (
          <p className="text-xs text-red-600">{errors.perUserLimit}</p>
        )}
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-1">
          Categories (none = all)
        </p>
        <div className="max-h-28 overflow-y-auto border border-gray-200 rounded-lg p-1.5 space-y-1 bg-white">
          {categoryList.length === 0 && (
            <p className="text-xs text-gray-400 italic px-1">No categories</p>
          )}
          {categoryList.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-1.5 text-xs cursor-pointer px-1 py-0.5 rounded hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={formData.categoryIds.includes(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// Start / Expiry dates
interface ValidityFieldsProps {
  formData: CouponFormData;
  onChange: (field: keyof CouponFormData, value: any) => void;
  errors: Record<string, string>;
}
const ValidityFields: FC<ValidityFieldsProps> = ({ formData, onChange, errors }) => (
  <div className="space-y-2 min-w-[150px]">
    <div className="space-y-1">
      <label className="text-xs text-gray-500">Start</label>
      <input
        type="date"
        value={formData.startDate}
        onChange={(e) => onChange("startDate", e.target.value)}
        className={inputClass()}
      />
    </div>
    <div className="space-y-1">
      <label className="text-xs text-gray-500">Expiry</label>
      <input
        type="date"
        value={formData.expiryDate}
        onChange={(e) => onChange("expiryDate", e.target.value)}
        className={inputClass(errors.expiryDate)}
      />
      {errors.expiryDate && (
        <p className="text-xs text-red-600">{errors.expiryDate}</p>
      )}
    </div>
  </div>
);

// Active Toggle (edit mode)
interface ActiveToggleProps {
  isActive: boolean;
  onChange: (v: boolean) => void;
}
const ActiveToggle: FC<ActiveToggleProps> = ({ isActive, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <input
      type="checkbox"
      checked={isActive}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
    />
    <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
      {isActive ? "Active" : "Inactive"}
    </span>
  </label>
);

// Status Badge (view mode, clickable)
interface StatusBadgeProps {
  isActive: boolean;
  onToggle?: () => void;
}
const StatusBadge: FC<StatusBadgeProps> = ({ isActive, onToggle }) => (
  <button
    onClick={onToggle}
    disabled={!onToggle}
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
      onToggle
        ? "hover:scale-105 active:scale-95 cursor-pointer"
        : "cursor-default"
    } ${
      isActive
        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
    title={onToggle ? "Click to toggle status" : undefined}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        isActive ? "bg-emerald-500" : "bg-gray-400"
      }`}
    />
    {isActive ? "Active" : "Inactive"}
  </button>
);

export default AllCouponsComp;