import { Suspense } from "react";
import InventoryManagement from "@/component/admin/Inventory/InventoryManagement";

export const metadata = { title: "Inventory | Admin" };

export default function InventoryPage() {
  return (
    <Suspense>
      <InventoryManagement />
    </Suspense>
  );
}
