export interface LabelSize {
  id: number;
  name: string;
  widthMm: number;
  heightMm: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrintingSettings {
  courierLabelWidthMm: number;
  courierLabelHeightMm: number;
}

export type InvoicePaperSize = "A4" | "LETTER" | "CUSTOM";

export interface InvoiceSettings {
  invoicePaperSize: InvoicePaperSize;
  invoicePaperWidthMm: number | null;
  invoicePaperHeightMm: number | null;
}
