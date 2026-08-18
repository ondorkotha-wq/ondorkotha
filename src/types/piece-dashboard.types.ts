import { PieceStatus } from "./piece.types";

export type InventorySummary = Record<PieceStatus, number>;

export interface ShelfMapEntry {
  id: string;
  code: string;
  label?: string | null;
  pieceCount: number;
  pieces: {
    barcodeValue: string;
    productTitle: string;
    color: string;
    size: string;
  }[];
}

export interface DamageBySupplier {
  supplierId: number | null;
  supplierName: string;
  incomingCount: number;
  returnCount: number;
}

export interface DamageByType {
  damagedIncoming: number;
  damagedReturn: number;
}
