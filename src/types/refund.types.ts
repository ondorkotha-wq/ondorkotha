/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared types for the Return Requests / Refunds feature.
// Mirrors the backend's Prisma enums & RefundService response shapes 1:1.

export type ReturnRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ITEM_RECEIVED"
  | "REFUNDED"
  | "CANCELLED";

export type RefundStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type RefundMethod = "GATEWAY" | "MANUAL";

// Fixed set of categories a customer can file a return under — mirrors the
// backend's RETURN_REASON_CODES allow-list (src/refund/constants/return-reason.constant.ts).
// Requests filed before this list existed may still carry old free-text
// values, so anything rendering `reason` should fall back to showing it as-is
// rather than assuming it matches one of these codes.
export const RETURN_REASON_OPTIONS = [
  { code: "DEFECTIVE_DAMAGED", label: "Defective / Damaged Item" },
  { code: "NOT_AS_DESCRIBED", label: "Not as Described" },
  { code: "WRONG_ITEM_RECEIVED", label: "Wrong Item Received" },
  { code: "CHANGED_MIND", label: "Changed Mind" },
  { code: "WRONG_SIZE", label: "Wrong Size" },
  { code: "OTHER", label: "Other" },
] as const;

export type ReturnReasonCode = (typeof RETURN_REASON_OPTIONS)[number]["code"];

export const formatReturnReason = (reason: string): string => {
  const known = RETURN_REASON_OPTIONS.find((r) => r.code === reason);
  return known ? known.label : reason;
};

export interface OrderItemSnapshot {
  id: number;
  productId: number;
  productTitle: string;
  sku?: string | null;
  color?: string | null;
  size?: string | null;
  quantity: number;
  priceAtPurchase: number;
  basePriceAtPurchase: number;
  totalPriceAtPurchase: number;
}

export interface ReturnRequestItem {
  id: number;
  returnRequestId: number;
  orderItemId: number;
  quantity: number;
  orderItem?: OrderItemSnapshot;
}

export interface ReturnRequestOrderSummary {
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  status?: string;
  total?: number;
}

export interface PaymentRefund {
  id: number;
  paymentId: number;
  returnRequestId?: number | null;
  amount: number;
  reason?: string | null;
  status: RefundStatus;
  refundMethod: RefundMethod;
  gatewayRefundId?: string | null;
  gatewayResponse?: any;
  requestedBy?: number | null;
  processedBy?: number | null;
  processedAt?: string | null;
  notes?: string | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  payment?: {
    id: number;
    transactionId: string;
    method: string;
    orderId: number;
    order?: { orderId: string; customerName?: string };
  };
}

export interface ReturnRequest {
  id: number;
  orderId: number;
  requestedBy?: number | null;
  reason: string;
  note?: string | null;
  previousOrderStatus: string;
  status: ReturnRequestStatus;
  adminNote?: string | null;
  reviewedBy?: number | null;
  reviewedAt?: string | null;
  receivedBy?: number | null;
  receivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: ReturnRequestItem[];
  refunds?: PaymentRefund[];
  order?: ReturnRequestOrderSummary;
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedReturnRequests {
  data: ReturnRequest[];
  meta: Meta;
}

export interface PaginatedRefunds {
  data: PaymentRefund[];
  meta: Meta;
}
