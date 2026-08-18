"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { RotateCcw } from "lucide-react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useInventorySocket from "@/hooks/Inventory/useInventorySocket";
import { Piece } from "@/types/piece.types";

// Self-contained, same pattern as StalePieceAlertCard — fetches
// independently so it can ship additively without touching the existing
// dashboard data pipeline. Also listens on the realtime inventory socket
// so a return that starts while the dashboard is open shows up immediately
// (toast + card update), not just on next page load.
export default function ReturningAlertCard() {
  const axiosSecure = useAxiosSecure();
  const [pieces, setPieces] = useState<Piece[] | null>(null);

  const fetchReturning = useCallback(() => {
    axiosSecure
      .get<Piece[]>("/pieces", { params: { status: "RETURNING" } })
      .then(({ data }) => setPieces(data))
      .catch(() => {});
  }, [axiosSecure]);

  useEffect(() => {
    fetchReturning();
  }, [fetchReturning]);

  useInventorySocket({
    onReturnStarted: (payload) => {
      toast(`Return started — order #${payload.orderId} (${payload.pieceCount} piece${payload.pieceCount === 1 ? "" : "s"})`, {
        icon: "↩️",
      });
      fetchReturning();
    },
  });

  if (!pieces || pieces.length === 0) return null;

  return (
    <Link
      href="/admin/pieces?tab=return"
      className="mt-4 flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 hover:bg-orange-100 transition-colors"
    >
      <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
        <RotateCcw size={18} className="text-orange-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-orange-900">
          {pieces.length} piece{pieces.length === 1 ? "" : "s"} coming back
          from a courier return
        </p>
        <p className="text-xs text-orange-700">
          Scan them in under Process Return once they&apos;re physically back
          at the warehouse
        </p>
      </div>
    </Link>
  );
}
