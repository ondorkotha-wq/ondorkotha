"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { LabelEntry, LabelFieldConfig } from "./types";

const taka = (n: number) => `৳ ${Number(n).toLocaleString("en-BD")}`;

const BarcodeSvg = ({ value }: { value: string }) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    JsBarcode(ref.current, value, {
      format: "CODE128",
      displayValue: true,
      fontSize: 10,
      height: 30,
      margin: 0,
    });
  }, [value]);

  return <svg ref={ref} className="max-w-full" />;
};

interface SingleLabelProps {
  entry: LabelEntry;
  config: LabelFieldConfig;
  widthMm: number;
  heightMm: number;
  businessName?: string;
}

const SingleLabel = ({
  entry,
  config,
  widthMm,
  heightMm,
  businessName,
}: SingleLabelProps) => {
  return (
    <div
      className="label flex flex-col items-center justify-between overflow-hidden bg-white text-black"
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        padding: "1.5mm",
        boxSizing: "border-box",
      }}
    >
      {config.businessName.show && businessName && (
        <div
          className="font-bold uppercase tracking-wide text-center"
          style={{ fontSize: `${config.businessName.sizePt}pt` }}
        >
          {businessName}
        </div>
      )}

      {config.productName.show && (
        <div
          className="font-semibold text-center leading-tight"
          style={{ fontSize: `${config.productName.sizePt}pt` }}
        >
          {entry.productTitle}
        </div>
      )}

      {config.variation.show && entry.variation && (
        <div
          className="text-center text-gray-700"
          style={{ fontSize: `${config.variation.sizePt}pt` }}
        >
          {entry.variation}
        </div>
      )}

      <BarcodeSvg value={entry.barcodeValue} />

      {config.price.show && entry.price !== undefined && (
        <div
          className="font-bold text-center"
          style={{ fontSize: `${config.price.sizePt}pt` }}
        >
          {taka(entry.price)}
        </div>
      )}

      {config.lotNumber.show && entry.lotNumber && (
        <div
          className="text-center"
          style={{ fontSize: `${config.lotNumber.sizePt}pt` }}
        >
          Lot: {entry.lotNumber}
        </div>
      )}

      {config.packingDate.show && entry.packingDate && (
        <div
          className="text-center"
          style={{ fontSize: `${config.packingDate.sizePt}pt` }}
        >
          Packed: {entry.packingDate}
        </div>
      )}
    </div>
  );
};

interface LabelSheetProps {
  entries: LabelEntry[];
  config: LabelFieldConfig;
  widthMm: number;
  heightMm: number;
  businessName?: string;
}

const LabelSheet = ({
  entries,
  config,
  widthMm,
  heightMm,
  businessName,
}: LabelSheetProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((entry, i) => (
        <SingleLabel
          key={`${entry.barcodeId}-${i}`}
          entry={entry}
          config={config}
          widthMm={widthMm}
          heightMm={heightMm}
          businessName={businessName}
        />
      ))}
    </div>
  );
};

export default LabelSheet;
