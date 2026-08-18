"use client";

export interface BarcodeItem {
  id: number;
  barcode: string;
  warehouse: string;
  rack: string;
  bin: string;
  quantity: number;
  product?: { name: string };
}

interface BarcodeRowProps {
  item: BarcodeItem;
  refresh: () => void;
}

export default function BarcodeRow({ item, refresh }: BarcodeRowProps) {
  const viewBarcode = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/barcodes/${item.id}/image`
    );
  };

  const handleAddStock = () => {
    // await updateQuantity(item.id, 1);
    refresh();
  };

  const handlePrint = () => {
    // await printLabels([item.id]);
  };

  return (
    <tr className="border-t">
      <td className="p-3 font-mono">{item.barcode}</td>

      <td className="p-3">{item.product?.name}</td>

      <td className="p-3">
        {item.warehouse} / {item.rack} / {item.bin}
      </td>

      <td className="p-3">
        <span
          className={`px-2 py-1 rounded text-xs ${
            item.quantity < 5
              ? "bg-red-100 text-red-600"
              : "bg-green-100 text-green-700"
          }`}
        >
          {item.quantity}
        </span>
      </td>

      <td className="p-3 flex gap-2">
        <button onClick={viewBarcode} className="px-2 py-1 border rounded">
          View
        </button>

        <button onClick={handlePrint} className="px-2 py-1 border rounded">
          Print
        </button>

        <button onClick={handleAddStock} className="px-2 py-1 border rounded">
          +1
        </button>
      </td>
    </tr>
  );
}
