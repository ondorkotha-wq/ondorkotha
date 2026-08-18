export interface LabelFieldToggle {
  show: boolean;
  sizePt: number;
}

export interface LabelFieldConfig {
  productName: LabelFieldToggle;
  variation: LabelFieldToggle;
  price: LabelFieldToggle;
  businessName: LabelFieldToggle;
  packingDate: LabelFieldToggle;
  lotNumber: LabelFieldToggle;
}

export const DEFAULT_LABEL_CONFIG: LabelFieldConfig = {
  productName: { show: true, sizePt: 10 },
  variation: { show: true, sizePt: 8 },
  price: { show: true, sizePt: 9 },
  businessName: { show: true, sizePt: 7 },
  packingDate: { show: false, sizePt: 7 },
  lotNumber: { show: false, sizePt: 7 },
};

export interface LabelEntry {
  barcodeId: string;
  barcodeValue: string;
  productTitle: string;
  variation?: string;
  price?: number;
  lotNumber?: string;
  packingDate?: string;
}

export interface LabelRow extends LabelEntry {
  labelQty: number;
}
