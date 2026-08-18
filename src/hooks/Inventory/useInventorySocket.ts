/* eslint-disable react-hooks/refs */
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import {
  StockUpdatedEvent,
  StockLowEvent,
  ReturnStartedEvent,
  AdminNotificationEvent,
} from "@/types/inventory";

const SOCKET_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
  /\/api(\/v\d+)?\/?$/,
  "",
);

interface Options {
  onStockUpdated?: (payload: StockUpdatedEvent) => void;
  onStockLow?: (payload: StockLowEvent) => void;
  onReturnStarted?: (payload: ReturnStartedEvent) => void;
  onNotificationNew?: (payload: AdminNotificationEvent) => void;
}

export default function useInventorySocket({
  onStockUpdated,
  onStockLow,
  onReturnStarted,
  onNotificationNew,
}: Options) {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const onStockUpdatedRef = useRef(onStockUpdated);
  const onStockLowRef = useRef(onStockLow);
  const onReturnStartedRef = useRef(onReturnStarted);
  const onNotificationNewRef = useRef(onNotificationNew);

  onStockUpdatedRef.current = onStockUpdated;
  onStockLowRef.current = onStockLow;
  onReturnStartedRef.current = onReturnStarted;
  onNotificationNewRef.current = onNotificationNew;

  useEffect(() => {
    if (!token) return;

    const socket = io(`${SOCKET_BASE}/inventory`, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("stock:updated", (payload: StockUpdatedEvent) => {
      onStockUpdatedRef.current?.(payload);
    });

    socket.on("stock:low", (payload: StockLowEvent) => {
      onStockLowRef.current?.(payload);
    });

    socket.on("return:started", (payload: ReturnStartedEvent) => {
      onReturnStartedRef.current?.(payload);
    });

    socket.on("notification:new", (payload: AdminNotificationEvent) => {
      onNotificationNewRef.current?.(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);
}
