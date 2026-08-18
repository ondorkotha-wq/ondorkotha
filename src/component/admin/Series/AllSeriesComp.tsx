"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import useFetchSeries from "@/hooks/Categories/Series/useFetchSeries";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { GenericReorderTable } from "../GenericReorderTable";
import LoadingDots from "@/component/Loading/LoadingDS";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { Series } from "@/types/menu";
import { DeleteConfirmationModal } from "../Modal/DeleteConfirmationModal";
import { useHasPermission } from "@/context/PermissionsContext";

interface ApiError {
  response?: { data?: { message?: string } };
}

const PinnedRow = ({
  series,
  position,
}: {
  series: Series;
  position: "first" | "last";
}) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg opacity-70">
    <span className="text-gray-400 text-xs font-mono select-none">⚲</span>
    <span className="text-sm font-medium text-gray-600">{series.name}</span>
    <span className="ml-auto text-xs text-gray-400 italic">
      Always {position} — cannot reorder
    </span>
  </div>
);

const AllSeriesComp = () => {
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const { seriesList, isLoading, refetch } = useFetchSeries({ isActive: null });
  const canUpdate = useHasPermission("CATEGORY_UPDATE");
  const canReorder = useHasPermission("CATEGORY_REORDER");
  const canDelete = useHasPermission("CATEGORY_DELETE");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Series | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Separate pinned series from normal ones
  const pinnedFirst = (seriesList || []).filter((s) => s.seriesType === "NEW");
  const pinnedLast = (seriesList || []).filter((s) => s.seriesType === "SALE");
  const normalSeries = (seriesList || []).filter(
    (s) => s.seriesType !== "NEW" && s.seriesType !== "SALE",
  );

  const handleSave = async (payload: { id: number | string; sortOrder: number }[]) => {
    setIsSaving(true);
    try {
      await axiosSecure.patch("/series/reorder", { orders: payload });
      toast.success("Series order updated");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axiosSecure.delete(`/series/${deleteTarget.slug}`);
      toast.success("Series deleted successfully");
      setDeleteTarget(null);
      await refetch();
    } catch (error: unknown) {
      toast.error(
        (error as ApiError)?.response?.data?.message || "Delete failed",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading)
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );

  return (
    <div className="space-y-3">
      {pinnedFirst.map((s) => (
        <PinnedRow key={s.id} series={s} position="first" />
      ))}

      <GenericReorderTable
        title="Product Series"
        description="Manage the appearance order of your furniture collections."
        initialData={normalSeries}
        isSaving={isSaving}
        onSave={handleSave}
        onEdit={(slug) => router.push(`/admin/series/update/${slug}`)}
        onDelete={canDelete ? (series) => setDeleteTarget(series) : undefined}
        canEdit={canUpdate}
        canReorder={canReorder}
      />

      {pinnedLast.map((s) => (
        <PinnedRow key={s.id} series={s} position="last" />
      ))}

      <DeleteConfirmationModal
        open={!!deleteTarget}
        isLoading={isDeleting}
        title="Delete series?"
        message={`This will permanently delete "${deleteTarget?.name}". This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AllSeriesComp;
