import { Suspense } from "react";
import PieceInventoryManagement from "@/component/Barcode/Piece/PieceInventoryManagement";

export const metadata = { title: "Piece Barcodes | Admin" };

export default function PiecesPage() {
  return (
    <Suspense>
      <PieceInventoryManagement />
    </Suspense>
  );
}
