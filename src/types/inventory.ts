export interface InventoryRow {
  productSizeId: number;
  sku: string | null;
  quantity: number;
  lowStockAt: number;
  isLowStock: boolean;
  size: string;
  color: string;
  price: number;
  product: {
    id: number;
    title: string;
    slug: string;
    sku: string | null;
  };
  trackingMode: "LEGACY_QUANTITY" | "PIECE_BARCODE";
}

export interface InventoryListResponse {
  total: number;
  items: InventoryRow[];
}

export interface LowStockResponse {
  count: number;
  items: InventoryRow[];
}

export type AdjustReason = "RESTOCK" | "CORRECTION" | "DAMAGE" | "OTHER";

export interface StockHistoryEntry {
  id: number;
  delta: number;
  quantityAfter: number;
  reason:
    | AdjustReason
    | "ORDER_PLACED"
    | "ORDER_CANCELLED"
    | "ORDER_RETURNED";
  note?: string | null;
  createdAt: string;
  admin?: { id: number; name: string } | null;
}

export interface StockUpdatedEvent {
  productSizeId: number;
  productId: number;
  quantity: number;
  lowStockAt: number;
}

export interface StockLowEvent {
  productSizeId: number;
  productId: number;
  quantity: number;
  lowStockAt: number;
}

export interface ReturnStartedEvent {
  orderId: string;
  pieceCount: number;
  reasonCode?: string | null;
}

export interface AdminNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface AdminNotificationEvent {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  createdAt: string;
  unreadCount: number;
}
