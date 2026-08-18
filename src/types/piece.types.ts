export type PieceStatus =
  | "CREATED"
  | "DAMAGED_INCOMING"
  | "IN_STOCK"
  | "RESERVED"
  | "PICKED"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURNING"
  | "RETURNED_IN_STOCK"
  | "DAMAGED_RETURN"
  | "VOID";

export type ReceiveOutcome = "GOOD" | "DAMAGED";

export interface PieceLocation {
  id: string;
  code: string;
  zone: string;
  aisle: string;
  shelf: string;
  bin: string;
  label?: string | null;
}

export interface PieceSupplier {
  id: number;
  name: string;
}

export interface Piece {
  id: number;
  barcodeValue: string;
  productSizeId: number;
  status: PieceStatus;
  locationId: string | null;
  receiveBatchId: string | null;
  generateBatchId: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: PieceSupplier | null;
  location?: PieceLocation | null;
  productSize: {
    id: number;
    sku: string | null;
    price: number | null;
    basePrice: number | null;
    size: { name: string };
    color: {
      color: { name: string };
      product: { id: number; title: string; slug: string; sku: string | null };
    };
  };
}

export interface ReceiveBatchResult {
  receiveBatchId: string;
  succeeded: Piece[];
  failed: { barcodeValue: string; error: string }[];
}

export interface VoidPiecesResult {
  succeeded: Piece[];
  failed: { barcodeValue: string; error: string }[];
}

export interface GeneratePiecesResult {
  batchId: string;
  pieces: Piece[];
}

export interface BatchReconciliation {
  batchId: string;
  productSizeId: number;
  quantity: number;
  received: number;
  pending: number;
  voided: number;
  createdAt: string;
}

export interface OpenGenerationBatch {
  batchId: string;
  productSizeId: number;
  productTitle: string;
  color: string;
  size: string;
  quantity: number;
  received: number;
  pending: number;
  voided: number;
  createdAt: string;
}

export interface StaleGenerationBatch extends OpenGenerationBatch {
  ageDays: number;
}
