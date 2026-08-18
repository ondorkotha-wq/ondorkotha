/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { GripVertical, Edit3, Save, Trash2 } from "lucide-react";
import { cn } from "@/utils/mergeTailwind";
import { ShortSeries } from "@/types/menu";

interface BaseItem {
  id: number | string;
  name: string;
  slug: string;
  image?: string | null;
  notice?: string | null;
  isActive?: boolean | null;
  sortOrder: number;
  series?: ShortSeries;
  category?: {
    id: number;
    name: string;
    series?: ShortSeries;
  };
}

interface GenericReorderTableProps<T extends BaseItem> {
  initialData: T[];
  onSave: (items: { id: T["id"]; sortOrder: number }[]) => Promise<void>;
  onEdit: (slug: string) => void;
  onDelete?: (item: T) => void;
  title: string;
  description: string;
  isSaving: boolean;
  nowFetching?: string;
  // Both default true so existing callers that haven't been updated keep
  // their current behavior — pass explicitly once the caller knows the
  // viewer's permissions.
  canEdit?: boolean;
  canReorder?: boolean;
}

export function GenericReorderTable<T extends BaseItem>({
  nowFetching,
  initialData,
  onSave,
  onEdit,
  onDelete,
  title,
  description,
  isSaving,
  canEdit = true,
  canReorder = true,
}: GenericReorderTableProps<T>) {
  const [list, setList] = useState<T[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setList([...initialData].sort((a, b) => a.sortOrder - b.sortOrder));
  }, [initialData]);

  const handleDragEnd = (result: DropResult) => {
    if (!canReorder || !result.destination) return;
    const items = Array.from(list);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      sortOrder: index,
    }));
    setList(updatedItems);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const payload = list.map((item) => ({
      id: item.id,
      sortOrder: item.sortOrder,
    }));
    await onSave(payload);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        {canReorder && hasChanges && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save Order"}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-4 py-3"></th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                  Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                  Slug
                </th>
                {nowFetching === "categories" ||
                  (nowFetching === "subcategories" && (
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                      Parent
                    </th>
                  ))}
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <Droppable droppableId="generic-list">
              {(provided) => (
                <tbody
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="divide-y divide-slate-200"
                >
                  {list.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id.toString()}
                      index={index}
                      isDragDisabled={!canReorder}
                    >
                      {(provided, snapshot) => (
                        <tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "transition-colors",
                            snapshot.isDragging
                              ? "bg-indigo-50"
                              : "hover:bg-slate-50",
                          )}
                        >
                          <td className="px-4 py-4">
                            {canReorder && (
                              <div
                                {...provided.dragHandleProps}
                                className="text-slate-400 hover:text-indigo-600 cursor-grab"
                              >
                                <GripVertical size={20} />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-14 rounded overflow-hidden border border-slate-200 bg-slate-100">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-[10px]">
                                    NA
                                  </div>
                                )}
                              </div>
                              <div className="text-sm font-bold text-slate-900">
                                {item.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                            /{item.slug}
                          </td>
                          {(nowFetching === "categories" ||
                            nowFetching === "subcategories") && (
                            <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                              {nowFetching === "categories"
                                ? item.series?.name
                                : nowFetching === "subcategories" &&
                                  `${item.category?.name} (${item.category?.series?.name})`}
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                item.isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-500",
                              )}
                            >
                              {item.isActive ? "Active" : "Hidden"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              {canEdit && (
                                <button
                                  onClick={() => onEdit(item.slug)}
                                  className="p-2 text-slate-400 hover:text-indigo-600"
                                >
                                  <Edit3 size={18} />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => onDelete(item)}
                                  className="p-2 text-slate-400 hover:text-red-600"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </table>
        </DragDropContext>
      </div>
    </div>
  );
}
