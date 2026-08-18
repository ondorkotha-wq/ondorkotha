/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, useMemo, useEffect, FC } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useFetchProducts from "@/hooks/Products/useFetchProducts";
import {
  Edit3,
  Save,
  Trash2,
  X,
  Plus,
  Zap,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import LoadingDots from "@/component/Loading/LoadingDS";
import { DeleteConfirmationModal } from "../Modal/DeleteConfirmationModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlashSaleListItem {
  id: number;
  title: string;
  subtitle: string | null;
  bannerText: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  _count: { products: number };
}

interface FlashSaleProductLite {
  id: number;
  title: string;
  slug: string;
  price: number;
  basePrice: number;
  images?: { image: string }[];
}

interface FlashSaleDetail extends Omit<FlashSaleListItem, "_count"> {
  products: { product: FlashSaleProductLite }[];
}

interface FormData {
  title: string;
  subtitle: string;
  bannerText: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_FORM: FormData = {
  title: "",
  subtitle: "",
  bannerText: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

const inputCls =
  "block w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-white border-gray-300";

const toLocalDateTime = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

function getStatus(sale: {
  isActive: boolean;
  startDate: string;
  endDate: string;
}): { label: string; color: string; dot: string } {
  if (!sale.isActive)
    return { label: "Inactive", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  const now = Date.now();
  const start = new Date(sale.startDate).getTime();
  const end = new Date(sale.endDate).getTime();
  if (now < start)
    return { label: "Scheduled", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
  if (now > end)
    return { label: "Expired", color: "bg-red-100 text-red-600", dot: "bg-red-400" };
  return { label: "Live", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" };
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

// ─── Main Component ───────────────────────────────────────────────────────────

const FlashSaleManagement: React.FC = () => {
  const axiosSecure = useAxiosSecure();

  const { data: items = [], isLoading, refetch } = useQuery<FlashSaleListItem[]>({
    queryKey: ["flash-sales-admin"],
    queryFn: async () => {
      const res = await axiosSecure.get("/flash-sales");
      return res.data;
    },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [selectedProducts, setSelectedProducts] = useState<FlashSaleProductLite[]>([]);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setFormData(DEFAULT_FORM);
    setSelectedProducts([]);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback(
    async (id: number) => {
      setLoadingDetail(true);
      try {
        const res = await axiosSecure.get<FlashSaleDetail>(`/flash-sales/${id}`);
        const sale = res.data;
        setEditingId(id);
        setFormData({
          title: sale.title,
          subtitle: sale.subtitle ?? "",
          bannerText: sale.bannerText ?? "",
          startDate: toLocalDateTime(sale.startDate),
          endDate: toLocalDateTime(sale.endDate),
          isActive: sale.isActive,
        });
        setSelectedProducts(sale.products.map((p) => p.product));
        setModalOpen(true);
      } catch {
        toast.error("Failed to load flash sale");
      } finally {
        setLoadingDetail(false);
      }
    },
    [axiosSecure],
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
  }, []);

  const handleSave = useCallback(
    async (data: FormData, productIds: number[]) => {
      const payload = {
        title: data.title.trim(),
        subtitle: data.subtitle.trim() || null,
        bannerText: data.bannerText.trim() || null,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        isActive: data.isActive,
        productIds,
      };

      try {
        if (editingId !== null) {
          await axiosSecure.patch(`/flash-sales/${editingId}`, payload);
          toast.success("Flash sale updated");
        } else {
          await axiosSecure.post("/flash-sales", payload);
          toast.success("Flash sale created");
        }
        closeModal();
        await refetch();
      } catch (error: any) {
        const apiError = error as ApiError;
        toast.error(apiError?.response?.data?.message ?? "Operation failed");
        throw error;
      }
    },
    [axiosSecure, closeModal, editingId, refetch],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await axiosSecure.delete(`/flash-sales/${deleteId}`);
      toast.success("Flash sale deleted");
      setDeleteId(null);
      await refetch();
    } catch (error: any) {
      const apiError = error as ApiError;
      toast.error(apiError?.response?.data?.message ?? "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }, [axiosSecure, deleteId, refetch]);

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
            <Zap size={20} className="text-red-500" />
            Flash Sales
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Curated campaigns shown on the homepage and /sales — title, countdown
            window, and which products are featured.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={loadingDetail}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <Plus size={16} />
          New flash sale
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Title", "Products", "Date Range", "Status", "Actions"].map((h) => (
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
            {items.map((sale) => {
              const status = getStatus(sale);
              return (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 align-middle">
                    <p className="font-medium text-sm text-gray-900 max-w-[240px] truncate">
                      {sale.title}
                    </p>
                    {sale.subtitle && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[240px]">
                        {sale.subtitle}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 align-middle text-sm text-gray-600">
                    {sale._count.products}
                  </td>
                  <td className="px-5 py-4 align-middle whitespace-nowrap">
                    <span className="text-xs text-gray-600">
                      {fmt(sale.startDate)} → {fmt(sale.endDate)}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(sale.id)}
                        disabled={loadingDetail}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30"
                        title="Edit"
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        onClick={() => setDeleteId(sale.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-14">
          <Zap size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No flash sales yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create a campaign to feature a curated set of discounted products with a
            countdown.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            New flash sale
          </button>
        </div>
      )}

      {modalOpen && (
        <FlashSaleFormModal
          initialData={formData}
          initialProducts={selectedProducts}
          isEdit={editingId !== null}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {deleteId !== null && (
        <DeleteConfirmationModal
          open={!!deleteId}
          isLoading={isDeleting}
          title="Delete this flash sale?"
          message="This removes the campaign and its product list. Products themselves are not affected."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

// ─── Form modal ───────────────────────────────────────────────────────────────

interface FlashSaleFormModalProps {
  initialData: FormData;
  initialProducts: FlashSaleProductLite[];
  isEdit: boolean;
  onSave: (data: FormData, productIds: number[]) => Promise<void>;
  onClose: () => void;
}

const FlashSaleFormModal: FC<FlashSaleFormModalProps> = ({
  initialData,
  initialProducts,
  isEdit,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [selected, setSelected] = useState<FlashSaleProductLite[]>(initialProducts);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { products: searchResults, isLoading: searching } = useFetchProducts({
    search: debouncedSearch,
    limit: 8,
    thumb: true,
    enabled: debouncedSearch.length > 1,
    includeOutOfStock: true,
  });

  const selectedIds = useMemo(() => new Set(selected.map((p) => p.id)), [selected]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const addProduct = (p: FlashSaleProductLite) => {
    if (selectedIds.has(p.id)) return;
    setSelected((prev) => [...prev, p]);
  };

  const removeProduct = (id: number) => {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = "Title is required";
    if (!formData.startDate) errs.startDate = "Start date/time is required";
    if (!formData.endDate) errs.endDate = "End date/time is required";
    if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate)
      errs.endDate = "End must be after start";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix the errors before saving");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(
        formData,
        selected.map((p) => p.id),
      );
    } catch {
      // toast already shown by onSave
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Flash Sale" : "New Flash Sale"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-gray-600">Title *</label>
            <input
              type="text"
              placeholder="e.g. Weekend Flash Sale"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className={`${inputCls} mt-1`}
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">
              Subtitle (shown on homepage panel)
            </label>
            <input
              type="text"
              placeholder="e.g. Exclusive discounts on select furniture — while stocks last."
              value={formData.subtitle}
              onChange={(e) => handleChange("subtitle", e.target.value)}
              className={`${inputCls} mt-1`}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">
              Banner text (shown on /sales hero)
            </label>
            <input
              type="text"
              placeholder="e.g. Limited-time deals — grab them before they're gone!"
              value={formData.bannerText}
              onChange={(e) => handleChange("bannerText", e.target.value)}
              className={`${inputCls} mt-1`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Starts *</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className={`${inputCls} mt-1`}
              />
              {errors.startDate && (
                <p className="text-xs text-red-600 mt-1">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Ends *</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                className={`${inputCls} mt-1`}
              />
              {errors.endDate && (
                <p className="text-xs text-red-600 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange("isActive", e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>

          {/* Product picker */}
          <div className="border-t border-gray-100 pt-5">
            <label className="text-xs font-medium text-gray-600">
              Products in this campaign
            </label>
            <div className="relative mt-1.5">
              <Search
                size={15}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search products by title or SKU…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputCls} pl-8`}
              />
            </div>

            {debouncedSearch.length > 1 && (
              <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                {searching ? (
                  <div className="p-3 text-xs text-gray-400">Searching…</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-xs text-gray-400">No products found</div>
                ) : (
                  searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        addProduct({
                          id: p.id,
                          title: p.title,
                          slug: p.slug,
                          price: p.price,
                          basePrice: p.basePrice,
                          images: p.images,
                        })
                      }
                      disabled={selectedIds.has(p.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {p.images?.[0]?.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0].image}
                          alt={p.title}
                          className="w-8 h-8 rounded object-cover bg-gray-100 shrink-0"
                        />
                      )}
                      <span className="text-sm text-gray-800 truncate flex-1">
                        {p.title}
                      </span>
                      <span className="text-xs text-gray-500 shrink-0">৳{p.price}</span>
                      {selectedIds.has(p.id) && (
                        <span className="text-[10px] text-emerald-600 font-medium shrink-0">
                          Added
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {selected.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full pl-1 pr-2 py-1"
                  >
                    {p.images?.[0]?.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0].image}
                        alt={p.title}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    <span className="text-xs text-gray-700 max-w-[140px] truncate">
                      {p.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProduct(p.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {selected.length === 0 && (
              <p className="text-xs text-gray-400 mt-2">
                No products selected yet — search above to add some.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleManagement;
