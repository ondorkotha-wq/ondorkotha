"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Plus, Star } from "lucide-react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useFetchLabelSizes from "@/hooks/Settings/useFetchLabelSizes";
import useFetchPrintingSettings from "@/hooks/Settings/useFetchPrintingSettings";
import { useAttributeCRUD } from "@/hooks/Admin/Attributes/useAttributeCRUD";
import { DeleteConfirmationModal } from "../Modal/DeleteConfirmationModal";
import { LabelSize } from "@/types/settings";

interface LabelSizeFormData {
  name: string;
  widthMm: number;
  heightMm: number;
}

const DEFAULT_FORM: LabelSizeFormData = { name: "", widthMm: 0, heightMm: 0 };

function ProductLabelSizes() {
  const axiosSecure = useAxiosSecure();
  const { labelSizes, isLoading, refetch } = useFetchLabelSizes();

  const {
    editingId, setEditingId,
    isAdding,
    isProcessing, setIsProcessing,
    deleteId, setDeleteId,
    formData, setFormData,
    resetForm, startAdding,
  } = useAttributeCRUD<LabelSizeFormData>(DEFAULT_FORM);

  const handleEditInit = (size: LabelSize) => {
    setEditingId(size.id);
    setFormData({ name: size.name, widthMm: size.widthMm, heightMm: size.heightMm });
  };

  const handleSave = async (id?: number) => {
    if (!formData.name.trim()) return toast.error("Size name is required");
    if (!formData.widthMm || !formData.heightMm) {
      return toast.error("Width and height are required");
    }
    setIsProcessing(true);
    try {
      if (id) {
        await axiosSecure.patch(`/label-sizes/${id}`, formData);
        toast.success("Label size updated");
      } else {
        await axiosSecure.post("/label-sizes", formData);
        toast.success("Label size created");
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
      await axiosSecure.delete(`/label-sizes/${deleteId}`);
      toast.success("Label size removed");
      refetch();
      setDeleteId(null);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Delete failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await axiosSecure.patch(`/label-sizes/${id}/set-default`);
      toast.success("Default label size updated");
      refetch();
    } catch {
      toast.error("Failed to set default");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Product Label Sizes
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Saved barcode label sizes used on the Print Labels screen. Mark
            one as default.
          </p>
        </div>
        {!isAdding && (
          <button
            disabled={editingId !== null}
            onClick={startAdding}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Plus size={14} /> Add size
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Name", "Width (mm)", "Height (mm)", "Default", "Actions"].map((h) => (
                <th
                  key={h}
                  className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${h === "Actions" ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isAdding && (
              <tr className="bg-indigo-50/40">
                <td className="px-6 py-3">
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Gprinter GP-3120TUC"
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                    value={formData.widthMm || ""}
                    onChange={(e) => setFormData({ ...formData, widthMm: Number(e.target.value) })}
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                    value={formData.heightMm || ""}
                    onChange={(e) => setFormData({ ...formData, heightMm: Number(e.target.value) })}
                  />
                </td>
                <td className="px-6 py-3 text-gray-300 text-xs">—</td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleSave()}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && labelSizes.length === 0 && !isAdding && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                  No label sizes saved yet.
                </td>
              </tr>
            )}

            {labelSizes.map((size) => {
              const isEditing = editingId === size.id;
              return (
                <tr key={size.id} className={isEditing ? "bg-indigo-50/30" : "hover:bg-gray-50"}>
                  <td className="px-6 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{size.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        min={1}
                        step="0.01"
                        className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                        value={formData.widthMm || ""}
                        onChange={(e) => setFormData({ ...formData, widthMm: Number(e.target.value) })}
                      />
                    ) : (
                      <span className="text-gray-600">{size.widthMm}</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        min={1}
                        step="0.01"
                        className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                        value={formData.heightMm || ""}
                        onChange={(e) => setFormData({ ...formData, heightMm: Number(e.target.value) })}
                      />
                    ) : (
                      <span className="text-gray-600">{size.heightMm}</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => !size.isDefault && handleSetDefault(size.id)}
                      title={size.isDefault ? "Default" : "Set as default"}
                      className={`p-1.5 rounded-lg transition-colors ${size.isDefault ? "text-amber-500" : "text-gray-300 hover:text-amber-400"}`}
                    >
                      <Star size={14} fill={size.isDefault ? "currentColor" : "none"} />
                    </button>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSave(size.id)} disabled={isProcessing} className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            Save
                          </button>
                          <button onClick={resetForm} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditInit(size)} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            Edit
                          </button>
                          <button onClick={() => setDeleteId(size.id)} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            Delete
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
          title="Delete this label size?"
          message="Products using this size will fall back to the default size next time labels are printed."
          isLoading={isProcessing}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

function CourierLabelSize() {
  const axiosSecure = useAxiosSecure();
  const { printingSettings, isLoading, refetch } = useFetchPrintingSettings();

  const [form, setForm] = useState<{ widthMm: string; heightMm: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const active = form ?? {
    widthMm: printingSettings ? String(printingSettings.courierLabelWidthMm) : "",
    heightMm: printingSettings ? String(printingSettings.courierLabelHeightMm) : "",
  };

  const save = async () => {
    const widthMm = Number(active.widthMm);
    const heightMm = Number(active.heightMm);
    if (!widthMm || !heightMm) return toast.error("Width and height are required");

    setSaving(true);
    try {
      await axiosSecure.put("/settings/printing", {
        courierLabelWidthMm: widthMm,
        courierLabelHeightMm: heightMm,
      });
      toast.success("Courier label size saved");
      setForm(null);
      refetch();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">
          Courier Delivery Label Size
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Single size used whenever a courier shipment label is printed.
        </p>
      </div>
      <div className="px-6 py-5 flex items-end gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Width (mm)
          </label>
          <input
            type="number"
            min={1}
            step="0.01"
            value={active.widthMm}
            onChange={(e) => setForm({ ...active, widthMm: e.target.value })}
            className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Height (mm)
          </label>
          <input
            type="number"
            min={1}
            step="0.01"
            value={active.heightMm}
            onChange={(e) => setForm({ ...active, heightMm: e.target.value })}
            className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function BarcodeLabelSettingsComp() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Barcode &amp; Label Settings
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage product barcode label presets and the courier delivery
          label size.
        </p>
      </div>
      <div className="max-w-215 space-y-5">
        <ProductLabelSizes />
        <CourierLabelSize />
      </div>
    </div>
  );
}
