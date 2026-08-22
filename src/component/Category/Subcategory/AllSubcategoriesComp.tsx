/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { GenericReorderTable } from "../../admin/GenericReorderTable";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { useRouter } from "next/navigation";
import LoadingDots from "@/component/Loading/LoadingDS";
import useFetchSubcategories from "@/hooks/Categories/Subcategories/useFetchSubcategories";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { DeleteConfirmationModal } from "../../admin/Modal/DeleteConfirmationModal";
import { Category } from "@/types/menu";
import { useHasPermission } from "@/context/PermissionsContext";

interface ApiError {
  response?: { data?: { message?: string } };
}

const AllSubcategoriesComp = () => {
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const { subcategoryList, isLoading, refetch } = useFetchSubcategories({
    isActive: null,
  });
  const canUpdate = useHasPermission("CATEGORY_UPDATE");
  const canReorder = useHasPermission("CATEGORY_REORDER");
  const canDelete = useHasPermission("CATEGORY_DELETE");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async (payload: any) => {
    await axiosSecure.patch("/subcategories/reorder", { orders: payload });
    toast.success("Category order updated");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axiosSecure.delete(`/subcategory/${deleteTarget.slug}`);
      toast.success("Subcategory deleted successfully");
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
    <>
      <GenericReorderTable
        title="Product Types"
        description="Drag categories to reorder them"
        nowFetching="subcategories"
        initialData={subcategoryList || []}
        isSaving={false}
        onSave={handleSave}
        onEdit={(slug) => router.push(`/admin/subcategory/update/${slug}`)}
        onDelete={canDelete ? (subcategory) => setDeleteTarget(subcategory) : undefined}
        canEdit={canUpdate}
        canReorder={canReorder}
      />

      <DeleteConfirmationModal
        open={!!deleteTarget}
        isLoading={isDeleting}
        title="Delete Subcategory?"
        message={`This will permanently delete "${deleteTarget?.name}". This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default AllSubcategoriesComp;
