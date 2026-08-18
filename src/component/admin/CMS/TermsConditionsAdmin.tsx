"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { toast } from "react-hot-toast";
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { TermsCondition } from "@/types/terms-condition";
import axios from "axios";

interface FormState {
  title: string;
  content: string;
  isActive: boolean;
}

const empty: FormState = { title: "", content: "", isActive: true };

export default function TermsConditionsAdmin() {
  const axiosSecure = useAxiosSecure();

  const [items, setItems] = useState<TermsCondition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TermsCondition | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosSecure.get<TermsCondition[]>(
        "/terms-and-conditions",
      );
      setItems([...data].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch {
      toast.error("Failed to load terms & conditions");
    } finally {
      setIsLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setItems(reordered.map((item, index) => ({ ...item, sortOrder: index })));
    setHasOrderChanges(true);
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      await Promise.all(
        items.map((item) =>
          axiosSecure.patch(`/terms-and-conditions/${item.id}`, {
            sortOrder: item.sortOrder,
          }),
        ),
      );
      toast.success("Order saved");
      setHasOrderChanges(false);
    } catch {
      toast.error("Failed to save order");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const openNew = () => {
    setForm(empty);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: TermsCondition) => {
    setForm({
      title: item.title,
      content: item.content,
      isActive: item.isActive,
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.content.trim()) return toast.error("Content is required");

    setIsSaving(true);
    try {
      if (editingId) {
        await axiosSecure.patch(`/terms-and-conditions/${editingId}`, {
          title: form.title,
          content: form.content,
          isActive: form.isActive,
        });
      } else {
        await axiosSecure.post("/terms-and-conditions", {
          title: form.title,
          content: form.content,
          isActive: form.isActive,
          sortOrder: items.length,
        });
      }
      toast.success("Saved");
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : null;
      toast.error(msg ?? "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axiosSecure.delete(`/terms-and-conditions/${deleteTarget.id}`);
      toast.success("Deleted");
      setDeleteTarget(null);
      fetchItems();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Drag to reorder sections shown on /terms-and-conditions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasOrderChanges && (
            <button
              onClick={handleSaveOrder}
              disabled={isSavingOrder}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              {isSavingOrder ? "Saving…" : "Save Order"}
            </button>
          )}
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            New Section
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-sm text-gray-400">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-gray-500">No sections yet.</p>
            <button
              onClick={openNew}
              className="mt-3 text-sm text-indigo-600 hover:underline cursor-pointer hover:underline-offset-4 hover:text-indigo-700"
            >
              Create your first section
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="terms-list">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="divide-y divide-gray-100"
                >
                  {items.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={String(item.id)}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-4 px-6 py-4 group ${
                            snapshot.isDragging ? "bg-indigo-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="text-gray-300 hover:text-indigo-600 cursor-grab shrink-0"
                          >
                            <GripVertical size={18} />
                          </div>
                          <span className="w-6 text-xs text-gray-400 shrink-0">
                            {index + 1}
                          </span>
                          <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                              item.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {item.isActive ? (
                              <Eye size={10} />
                            ) : (
                              <EyeOff size={10} />
                            )}
                            {item.isActive ? "Active" : "Hidden"}
                          </span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">
                {editingId ? "Edit Section" : "New Section"}
              </h3>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Order Cancellation"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Content (HTML) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => set("content", e.target.value)}
                  placeholder={"<p>Orders can be cancelled within…</p>"}
                  rows={10}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-400 resize-y"
                />
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">
                  Active (visible to public)
                </span>
                <button
                  type="button"
                  onClick={() => set("isActive", !form.isActive)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    form.isActive ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      form.isActive ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>

            <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Delete section?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-medium text-gray-700">
                {deleteTarget.title}
              </span>{" "}
              will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
