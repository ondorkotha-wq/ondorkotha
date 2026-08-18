"use client";

import React, { useMemo, useEffect } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { Edit3, Save, Trash2, X, Plus, Layers, LinkIcon } from "lucide-react";
import toast from "react-hot-toast";
import LoadingDots from "@/component/Loading/LoadingDS";
import useFetchMaterials from "@/hooks/Attributes/useFetchMaterials";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { DeleteConfirmationModal } from "../Modal/DeleteConfirmationModal";
import StatusToggle from "./Status/StatusToggle";
import { SearchBar } from "@/component/Shared/Admin/AdminUI/AdminUI";
import { useAttributeCRUD } from "@/hooks/Admin/Attributes/useAttributeCRUD";

interface Material {
  id: number;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
}

interface MaterialFormData {
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
}

const DEFAULT_FORM: MaterialFormData = { name: "", slug: "", order: 0, isActive: true };

const AllMaterialsComp: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const { materials, isLoading, refetch } = useFetchMaterials({ isActive: null });

  const {
    editingId, setEditingId,
    isAdding,
    isProcessing, setIsProcessing,
    deleteId, setDeleteId,
    formData, setFormData,
    searchTerm, setSearchTerm,
    resetForm, startAdding,
  } = useAttributeCRUD<MaterialFormData>(DEFAULT_FORM);

  // Auto-generate slug from name while adding or editing
  useEffect(() => {
    if (!isAdding && !editingId) return;
    const generated = formData.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({ ...prev, slug: generated }));
  }, [formData.name, isAdding, editingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredMaterials = useMemo(() => {
    if (!materials) return [];
    return materials.filter((m: Material) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [materials, searchTerm]);

  const handleEditInit = (material: Material) => {
    setEditingId(material.id);
    setFormData({ name: material.name, slug: material.slug, order: material.order || 0, isActive: material.isActive });
  };

  const handleSave = async (id?: number) => {
    if (!formData.name.trim()) return toast.error("Name is required");
    if (!formData.slug.trim()) return toast.error("Slug is required");
    setIsProcessing(true);
    try {
      if (id) {
        await axiosSecure.patch(`/materials/${id}`, formData);
        toast.success("Material updated");
      } else {
        await axiosSecure.post("/materials", formData);
        toast.success("Material created");
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
      await axiosSecure.delete(`/materials/${deleteId}`);
      toast.success("Material removed");
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
              <Layers size={22} className="text-indigo-600" /> Material Library
            </h2>
            <p className="text-sm text-slate-500">Inventory of fabric and component materials</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search materials..."
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
              {["Identity", "Slug (URL)", "Status", "Actions"].map((h) => (
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
                    placeholder="Material Name"
                    className="w-full border-slate-200 rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <LinkIcon size={14} />
                    <input
                      type="text"
                      placeholder="auto-generated-slug"
                      className="w-full bg-transparent border-b border-slate-300 focus:border-indigo-500 outline-none font-mono text-xs"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
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

            {filteredMaterials.map((item: Material) => {
              const isEditing = editingId === item.id;
              return (
                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isEditing ? "bg-amber-50/30" : ""}`}>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full font-semibold border-slate-200 rounded px-2 py-1 border focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{item.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full text-xs font-mono text-slate-500 border-slate-200 rounded px-2 py-1 border outline-none"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                        <LinkIcon size={12} />
                        {item.slug}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <StatusToggle
                        active={formData.isActive}
                        onToggle={(v) => setFormData({ ...formData, isActive: v })}
                      />
                    ) : (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {item.isActive ? "Active" : "Hidden"}
                      </span>
                    )}
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

export default AllMaterialsComp;
