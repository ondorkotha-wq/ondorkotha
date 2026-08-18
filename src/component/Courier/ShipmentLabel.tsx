/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { CompanyInfo } from "@/types/company";

const taka = (n: number) =>
  `৳ ${Number(n).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const BarcodeSvg = ({ value }: { value: string }) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    JsBarcode(ref.current, value, {
      format: "CODE128",
      displayValue: true,
      fontSize: 12,
      height: 40,
      margin: 0,
    });
  }, [value]);

  return <svg ref={ref} className="max-w-full" />;
};

export interface ShipmentLabelShipment {
  id: number;
  consignmentId?: string | null;
  trackingNumber?: string | null;
  status: string;
  codAmount?: number | null;
  weight?: number | null;
  itemDescription?: string | null;
  special_instruction?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  recipientAddress?: string | null;
  createdAt: string;
  provider: { displayName: string; logo?: string | null };
  order: {
    orderId: string;
    customerName: string;
    customerPhone: string;
    total: number;
    shippingAddress?: string | null;
    districtName?: string | null;
    zoneName?: string | null;
    areaName?: string | null;
    postCode?: string | null;
  };
}

interface ShipmentLabelProps {
  shipment: ShipmentLabelShipment;
  company?: CompanyInfo;
  widthMm?: number;
  heightMm?: number;
}

const ShipmentLabel = ({
  shipment,
  company,
  widthMm = 100,
  heightMm = 150,
}: ShipmentLabelProps) => {
  const s = shipment;
  const barcodeValue = s.trackingNumber || s.consignmentId || String(s.id);

  const recipientName = s.recipientName || s.order.customerName;
  const recipientPhone = s.recipientPhone || s.order.customerPhone;
  const recipientAddress = [
    s.recipientAddress || s.order.shippingAddress,
    s.order.areaName,
    s.order.zoneName,
    s.order.districtName,
    s.order.postCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="label flex flex-col bg-white text-black"
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        padding: "4mm",
        boxSizing: "border-box",
        fontFamily: "sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2">
        <div className="flex items-center gap-2">
          {company?.logo && (
            <img src={company.logo} alt={company.name} className="h-8 object-contain" />
          )}
          <span className="font-bold text-sm uppercase">
            {company?.name || "Business"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {s.provider.logo && (
            <img
              src={s.provider.logo}
              alt={s.provider.displayName}
              className="h-6 object-contain"
            />
          )}
          <span className="font-semibold text-xs">{s.provider.displayName}</span>
        </div>
      </div>

      {/* Barcode */}
      <div className="flex justify-center border-b border-dashed border-black pb-2 mb-2">
        <BarcodeSvg value={barcodeValue} />
      </div>

      {/* FROM */}
      <div className="mb-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
          From
        </p>
        <p className="text-xs font-semibold">{company?.name || "Business"}</p>
        {company?.address && <p className="text-[10px]">{company.address}</p>}
        {company?.phone && <p className="text-[10px]">{company.phone}</p>}
      </div>

      {/* TO */}
      <div className="border-t border-black pt-2 mb-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
          To
        </p>
        <p className="text-sm font-bold">{recipientName}</p>
        <p className="text-xs font-mono">{recipientPhone}</p>
        <p className="text-[11px] mt-0.5 leading-snug">{recipientAddress || "—"}</p>
      </div>

      {/* Order info */}
      <div className="border-t border-black pt-2 mb-2 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
            Order
          </p>
          <p className="text-xs font-mono font-semibold">{s.order.orderId}</p>
          <p className="text-[10px] text-gray-600">{fmtDate(s.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
            {s.codAmount ? "COD" : "Prepaid"}
          </p>
          <p className="text-lg font-bold">
            {s.codAmount ? taka(s.codAmount) : "—"}
          </p>
        </div>
      </div>

      {/* Package info */}
      <div className="border-t border-black pt-2 mb-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
          Package
        </p>
        <p className="text-[10px]">Weight: {s.weight ? `${s.weight} kg` : "—"}</p>
        <p className="text-[10px] leading-snug">
          {s.itemDescription || "—"}
        </p>
        {s.special_instruction && (
          <p className="text-[10px] italic mt-0.5">
            Note: {s.special_instruction}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-2 border-t border-dashed border-black text-center">
        <p className="text-[10px] font-mono">
          {s.trackingNumber || s.consignmentId}
        </p>
      </div>
    </div>
  );
};

export default ShipmentLabel;
