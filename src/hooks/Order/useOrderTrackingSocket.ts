/* eslint-disable react-hooks/refs */
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

const SOCKET_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
  /\/api(\/v\d+)?\/?$/,
  "",
);

export interface OrderStatusUpdatedEvent {
  orderId: string;
  status: string;
  previousStatus: string;
  updatedAt: string;
}

interface Options {
  orderId: string | null | undefined;
  onStatusUpdated?: (payload: OrderStatusUpdatedEvent) => void;
}

interface SubscribeAck {
  ok: boolean;
  error?: string;
}

export default function useOrderTrackingSocket({
  orderId,
  onStatusUpdated,
}: Options) {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const onStatusUpdatedRef = useRef(onStatusUpdated);

  onStatusUpdatedRef.current = onStatusUpdated;

  useEffect(() => {
    if (!token || !orderId) return;

    const socket = io(`${SOCKET_BASE}/orders`, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    // Re-subscribing here (rather than once outside) also covers every
    // auto-reconnect — Socket.IO re-fires `connect` after a dropped
    // connection recovers, which re-joins the order's room server-side.
    socket.on("connect", () => {
      socket.emit(
        "subscribe:order",
        { orderId },
        (ack: SubscribeAck | undefined) => {
          if (!ack?.ok) {
            console.warn(
              `Order tracking subscribe rejected for order ${orderId}`,
            );
          }
        },
      );
    });

    socket.on("order:status-updated", (payload: OrderStatusUpdatedEvent) => {
      if (payload.orderId === orderId) {
        onStatusUpdatedRef.current?.(payload);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, orderId]);
}
