"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { Supplier } from "@/types/supplier.types";

interface SupplierFormState {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

const EMPTY_FORM: SupplierFormState = {
  name: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
};

export default function SupplierManagement() {
  const axiosSecure = useAxiosSecure();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SupplierFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosSecure.get<Supplier[]>("/suppliers");
      setSuppliers(res.data);
    } catch {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      contactName: s.contactName ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      address: s.address ?? "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        contactName: form.contactName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
      };
      if (editingId) {
        await axiosSecure.patch(`/suppliers/${editingId}`, payload);
        toast.success("Supplier updated");
      } else {
        await axiosSecure.post("/suppliers", payload);
        toast.success("Supplier created");
      }
      setShowForm(false);
      load();
    } catch {
      toast.error("Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: Supplier) => {
    try {
      await axiosSecure.patch(`/suppliers/${s.id}`, { isActive: !s.isActive });
      setSuppliers((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, isActive: !x.isActive } : x)),
      );
    } catch {
      toast.error("Failed to update supplier status");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Suppliers</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Attributed at receive time — used for damage reporting
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition"
        >
          + Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60">
            <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <th className="py-2.5 px-4">Name</th>
              <th className="py-2.5 px-4">Contact</th>
              <th className="py-2.5 px-4">Phone</th>
              <th className="py-2.5 px-4">Email</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">
                  No suppliers yet.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 px-4 font-medium text-gray-800">
                    {s.name}
                  </td>
                  <td className="py-2.5 px-4 text-gray-600">
                    {s.contactName || "—"}
                  </td>
                  <td className="py-2.5 px-4 text-gray-600">
                    {s.phone || "—"}
                  </td>
                  <td className="py-2.5 px-4 text-gray-600">
                    {s.email || "—"}
                  </td>
                  <td className="py-2.5 px-4">
                    <button
                      onClick={() => toggleActive(s)}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        s.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => openEdit(s)}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-5 space-y-3">
            <h2 className="text-base font-semibold text-gray-900">
              {editingId ? "Edit Supplier" : "New Supplier"}
            </h2>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Supplier name *"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={form.contactName}
              onChange={(e) =>
                setForm({ ...form, contactName: e.target.value })
              }
              placeholder="Contact person"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Address"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
