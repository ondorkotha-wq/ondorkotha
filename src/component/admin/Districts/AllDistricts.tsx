"use client";

import React, { useMemo } from "react";
import useFetchDistricts from "@/hooks/Districts/useFetchDistricts";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { Edit3, Save, Trash2, X, Plus, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import LoadingDots from "@/component/Loading/LoadingDS";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { DeleteConfirmationModal } from "../Modal/DeleteConfirmationModal";
import { SearchBar } from "@/component/Shared/Admin/AdminUI/AdminUI";
import { useAttributeCRUD } from "@/hooks/Admin/Attributes/useAttributeCRUD";

interface District {
  id: number;
  name: string;
  deliveryFee: number;
  isCODAvailable: boolean;
}

interface DistrictFormData {
  name: string;
  deliveryFee: number;
  isCODAvailable: boolean;
}

const DEFAULT_FORM: DistrictFormData = { name: "", deliveryFee: 0, isCODAvailable: true };

const AllDistrictsComp = () => {
  const { districts, isLoading, refetch } = useFetchDistricts();
  const axiosSecure = useAxiosSecure();

  const {
    editingId, setEditingId,
    isAdding,
    isProcessing, setIsProcessing,
    deleteId, setDeleteId,
    formData, setFormData,
    searchTerm, setSearchTerm,
    resetForm, startAdding,
  } = useAttributeCRUD<DistrictFormData>(DEFAULT_FORM);

  const filteredDistricts = useMemo(() => {
    if (!districts) return [];
    return (districts as District[]).filter((d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [districts, searchTerm]);

  const handleEditInit = (district: District) => {
    setEditingId(district.id);
    setFormData({ name: district.name, deliveryFee: district.deliveryFee, isCODAvailable: district.isCODAvailable });
  };

  const handleSave = async (id?: number) => {
    if (!formData.name.trim()) return toast.error("District name is required");
    setIsProcessing(true);
    try {
      if (id) {
        await axiosSecure.patch(`/districts/${id}`, formData);
        toast.success("District updated");
      } else {
        await axiosSecure.post("/create-districts", formData);
        toast.success("District added successfully");
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
      await axiosSecure.delete(`/districts/${deleteId}`);
      toast.success("District deleted");
      refetch();
      setDeleteId(null);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Delete failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <MapPin size={22} className="text-indigo-600" /> District Management
            </h2>
            <p className="text-sm text-slate-500">Manage delivery districts and fees</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search districts..."
              className="flex-1 md:w-64"
            />
            {!isAdding && (
              <button
                disabled={editingId !== null}
                onClick={startAdding}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-black text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
              >
                <Plus size={18} /> Add District
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["District", "Delivery Fee", "COD", "Actions"].map((h) => (
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
                    placeholder="District name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border-slate-200 rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={formData.deliveryFee}
                    onChange={(e) => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
                    className="w-28 border-slate-200 rounded-lg border p-2 outline-none"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={formData.isCODAvailable}
                    onChange={(e) => setFormData({ ...formData, isCODAvailable: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600"
                  />
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

            {filteredDistricts.map((district) => {
              const isEditing = editingId === district.id;
              return (
                <tr key={district.id} className={`hover:bg-slate-50 transition-colors ${isEditing ? "bg-amber-50/30" : ""}`}>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full font-semibold border-slate-200 rounded px-2 py-1 border focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{district.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.deliveryFee}
                        onChange={(e) => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
                        className="w-28 border-slate-200 rounded px-2 py-1 border outline-none"
                      />
                    ) : (
                      <span className="text-slate-700">৳ {district.deliveryFee}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={formData.isCODAvailable}
                        onChange={(e) => setFormData({ ...formData, isCODAvailable: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600"
                      />
                    ) : (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${district.isCODAvailable ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        {district.isCODAvailable ? "Available" : "Disabled"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSave(district.id)} disabled={isProcessing} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition">
                            {isProcessing ? "..." : <Save size={18} />}
                          </button>
                          <button onClick={resetForm} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition">
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditInit(district)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => setDeleteId(district.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
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

export default AllDistrictsComp;
