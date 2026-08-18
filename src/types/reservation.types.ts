export interface AvailablePiece {
  id: number;
  barcodeValue: string;
  productSizeId: number;
  location?: { id: string; code: string; label?: string | null } | null;
}

export interface ReservationLine {
  reservationId: number;
  orderItemId: number;
  barcodeValue: string;
  productTitle: string;
  color: string;
  size: string;
  locationCode: string | null;
  pickedAt: string | null;
}

export interface PickSlip {
  orderId: string;
  shipmentGroupId: number | null;
  lines: ReservationLine[];
}

export interface ShipmentGroupStatus {
  shipmentGroup: { id: number; status: "OPEN" | "SHIPPED" } | null;
  requiredCount: number;
  reservedCount: number;
  pickedCount: number;
  isFullyPicked: boolean;
}
