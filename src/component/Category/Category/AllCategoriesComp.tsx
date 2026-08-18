/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState } from "react";
import toast from "react-hot-toast";
import { GenericReorderTable } from "../../admin/GenericReorderTable";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { useRouter } from "next/navigation";
import useFetchCategories from "@/hooks/Categories/Categories/useFetchCategories";
import LoadingDots from "@/component/Loading/LoadingDS";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { DeleteConfirmationModal } from "../../admin/Modal/DeleteConfirmationModal";
import { Category } from "@/types/menu";
import { useHasPermission } from "@/context/PermissionsContext";

interface ApiError {
  response?: { data?: { message?: string } };
}

const AllCategoriesComp = () => {
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const { categoryList, isLoading, refetch } = useFetchCategories({ isActive: null });
  const canUpdate = useHasPermission("CATEGORY_UPDATE");
  const canReorder = useHasPermission("CATEGORY_REORDER");
  const canDelete = useHasPermission("CATEGORY_DELETE");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async (payload: any) => {
    await axiosSecure.patch("/categories/reorder", { orders: payload });
    toast.success("Category order updated");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axiosSecure.delete(`/category/${deleteTarget.slug}`);
      toast.success("Category deleted successfully");
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
        title="Product Categories"
        description="Drag categories to reorder them within their series."
        nowFetching="categories"
        initialData={categoryList || []}
        isSaving={false}
        onSave={handleSave}
        onEdit={(slug) => router.push(`/admin/category/update/${slug}`)}
        onDelete={canDelete ? (category) => setDeleteTarget(category) : undefined}
        canEdit={canUpdate}
        canReorder={canReorder}
      />

      <DeleteConfirmationModal
        open={!!deleteTarget}
        isLoading={isDeleting}
        title="Delete category?"
        message={`This will permanently delete "${deleteTarget?.name}". This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default AllCategoriesComp
