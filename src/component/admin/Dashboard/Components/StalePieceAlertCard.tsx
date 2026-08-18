"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { StaleGenerationBatch } from "@/types/piece.types";

// Self-contained, same pattern as PieceInventoryStatsTiles — fetches
// independently so it can ship additively without touching the existing
// dashboard data pipeline.
export default function StalePieceAlertCard() {
  const axiosSecure = useAxiosSecure();
  const [batches, setBatches] = useState<StaleGenerationBatch[] | null>(null);

  useEffect(() => {
    axiosSecure
      .get<StaleGenerationBatch[]>("/pieces/stale")
      .then(({ data }) => setBatches(data))
      .catch(() => {});
  }, [axiosSecure]);

  if (!batches || batches.length === 0) return null;

  const totalPending = batches.reduce((sum, b) => sum + b.pending, 0);

  return (
    <Link
      href="/admin/pieces?tab=reports"
      className="mt-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100 transition-colors"
    >
      <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
        <AlertTriangle size={18} className="text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-amber-900">
          {batches.length} barcode batch{batches.length === 1 ? "" : "es"}{" "}
          still unreceived past the stale threshold
        </p>
        <p className="text-xs text-amber-700">
          {totalPending} barcode{totalPending === 1 ? "" : "s"} pending —
          receive them or void the leftovers
        </p>
      </div>
    </Link>
  );
}
