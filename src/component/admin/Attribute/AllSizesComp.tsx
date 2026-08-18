"use client";

import React, { useMemo } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { Edit3, Save, Trash2, X, Plus, Ruler, Tag } from "lucide-react";
import toast from "react-hot-toast";
import LoadingDots from "@/component/Loading/LoadingDS";
import useFetchSizes from "@/hooks/Attributes/useFetchSizes";
import { ProductSizeRelation, Variant } from "@/types/product.types";
import useFetchVariants from "@/hooks/Attributes/useFetchVariants";
import StatusToggle from "./Status/StatusToggle";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { DeleteConfirmationModal } from "../Modal/DeleteConfirmationModal";
import { SearchBar } from "@/component/Shared/Admin/AdminUI/AdminUI";
import { useAttributeCRUD } from "@/hooks/Admin/Attributes/useAttributeCRUD";

interface SizeFormData {
  name: string;
  sortOrder: number;
  isActive: boolean;
  variantId: number | null;
}

const DEFAULT_FORM: SizeFormData = { name: "", sortOrder: 0, isActive: true, variantId: null };

const AllSizesComp: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const { sizes, isLoading, refetch } = useFetchSizes({ isActive: null });
  const { variants } = useFetchVariants({ needSize: false });

  const {
    editingId, setEditingId,
    isAdding,
    isProcessing, setIsProcessing,
    deleteId, setDeleteId,
    formData, setFormData,
    searchTerm, setSearchTerm,
    resetForm, startAdding,
  } = useAttributeCRUD<SizeFormData>(DEFAULT_FORM);

  const filteredSizes = useMemo(() => {
    if (!sizes) return [];
    return sizes.filter(
      (s: ProductSizeRelation) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.variant?.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [sizes, searchTerm]);

  const handleEditInit = (size: ProductSizeRelation) => {
    setEditingId(size.id);
    setFormData({
      name: size.name,
      sortOrder: size.sortOrder ?? 0,
      isActive: size.isActive ?? true,
      variantId: size.variantId,
    });
  };

  const handleSave = async (id?: number) => {
    if (!formData.name.trim()) return toast.error("Size name is required");
    if (!formData.variantId) return toast.error("Please select a variant");
    setIsProcessing(true);
    try {
      if (id) {
        await axiosSecure.patch(`/sizes/${id}`, formData);
        toast.success("Size updated");
      } else {
        await axiosSecure.post("/sizes", formData);
        toast.success("Size created");
      }
      refetch();
      resetForm();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Operation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsProcessing(true);
    try {
      await axiosSecure.delete(`/sizes/${deleteId}`);
      toast.success("Size removed");
      refetch();
      setDeleteId(null);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Delete failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading)
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Ruler size={22} className="text-indigo-600" /> Size Library
            </h2>
            <p className="text-sm text-slate-500">Manage dimension labels and sorting</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search sizes or variants..."
              className="flex-1 md:w-64"
            />
            {!isAdding && (
              <button
                disabled={editingId !== null}
                onClick={startAdding}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-black text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
              >
                <Plus size={18} /> Add New
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Size Name", "Variant Category", "Order", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className={`px-6 py-4 font-bold text-slate-500 uppercase tracking-wider ${h === "Actions" ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {isAdding && (
              <tr className="bg-indigo-50/40 border-l-4 border-indigo-500">
                <td className="px-6 py-4">
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. XL, 42, 10-inch"
                    className="w-full border-slate-200 rounded-lg border p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    className="w-full border-slate-200 rounded-lg border p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.variantId ?? ""}
                    onChange={(e) => setFormData({ ...formData, variantId: Number(e.target.value) })}
                  >
                    <option value="">Select Variant</option>
                    {variants?.map((variant: Variant) => (
                      <option key={variant.id} value={variant.id}>{variant.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    className="w-20 border-slate-200 rounded-lg border p-2 outline-none"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </td>
                <td className="px-6 py-4">
                  <StatusToggle active={formData.isActive} onToggle={(v) => setFormData({ ...formData, isActive: v })} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleSave()} disabled={isProcessing} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                      <Save size={18} />
                    </button>
                    <button onClick={resetForm} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300">
                      <X size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {filteredSizes.map((item: ProductSizeRelation) => {
              const isEditing = editingId === item.id;
              return (
                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isEditing ? "bg-amber-50/30" : ""}`}>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full font-semibold border-slate-200 rounded px-2 py-1 border outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{item.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <select
                        className="w-full border-slate-200 rounded px-2 py-1 border outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.variantId ?? ""}
                        onChange={(e) => setFormData({ ...formData, variantId: Number(e.target.value) })}
                      >
                        <option value="">Select Variant</option>
                        {variants?.map((variant: Variant) => (
                          <option key={variant.id} value={variant.id}>{variant.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Tag size={14} className="text-slate-400" />
                        {item.variant?.name || "Uncategorized"}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-20 border-slate-200 rounded px-2 py-1 border outline-none"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      />
                    ) : (
                      <span className="text-slate-500">{item.sortOrder}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusToggle
                      active={isEditing ? formData.isActive : (item.isActive ?? true)}
                      onToggle={(v) => isEditing ? setFormData({ ...formData, isActive: v }) : null}
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSave(item.id)} disabled={isProcessing} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition">
                            {isProcessing ? "..." : <Save size={18} />}
                          </button>
                          <button onClick={resetForm} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition">
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditInit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => setDeleteId(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {deleteId && (
        <DeleteConfirmationModal
          open={!!deleteId}
          isLoading={isProcessing}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

export default AllSizesComp;
