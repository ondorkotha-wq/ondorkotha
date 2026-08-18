import { FullOrder } from "@/hooks/Order/useOrders";

export interface Invoice {
  id: number;
  invoiceNo: string;
  issuedAt: string;
  total: number;
  order: FullOrder;
  dueDate?: string;
  paidAt?: string | null;
}
