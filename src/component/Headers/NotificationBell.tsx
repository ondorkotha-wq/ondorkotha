"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useInventorySocket from "@/hooks/Inventory/useInventorySocket";
import { AdminNotification } from "@/types/inventory";
import { cn } from "@/utils/mergeTailwind";

const iconButtonClass = cn(
  "p-2 rounded-lg text-gray-600 transition-colors duration-200",
  "hover:text-gray-900 hover:bg-gray-100",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
);

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificationBell() {
  const axiosSecure = useAxiosSecure();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    axiosSecure
      .get<{ items: AdminNotification[]; unreadCount: number }>(
        "/admin-notifications",
      )
      .then(({ data }) => {
        setItems(data.items);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
  }, [axiosSecure]);

  useEffect(() => {
    load();
  }, [load]);

  useInventorySocket({
    onNotificationNew: (payload) => {
      setUnreadCount(payload.unreadCount);
      setItems((prev) => [
        {
          id: payload.id,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          link: payload.link ?? null,
          readAt: null,
          createdAt: payload.createdAt,
        },
        ...prev,
      ].slice(0, 30));
    },
  });

  const markRead = (id: number) => {
    const wasUnread = items.some((n) => n.id === id && !n.readAt);
    if (!wasUnread) return;

    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    axiosSecure
      .post<{ unreadCount: number }>(`/admin-notifications/${id}/read`)
      .then(({ data }) => setUnreadCount(data.unreadCount))
      .catch(() => {
        // Revert the optimistic update — the request never landed, so the
        // badge/dot must not silently disappear as if it had.
        setItems((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: null } : n)),
        );
        setUnreadCount((prev) => prev + 1);
        toast.error("Couldn't mark notification as read");
      });
  };

  const markAllRead = () => {
    const prevItems = items;
    const prevUnreadCount = unreadCount;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    setUnreadCount(0);
    axiosSecure.post("/admin-notifications/read-all").catch(() => {
      setItems(prevItems);
      setUnreadCount(prevUnreadCount);
      toast.error("Couldn't mark notifications as read");
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(iconButtonClass, "relative")}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-104 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-gray-400">
                  No notifications yet
                </p>
              ) : (
                items.map((n) => {
                  const body = (
                    <div
                      className={cn(
                        "px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors",
                        !n.readAt && "bg-indigo-50/50",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!n.readAt && (
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        )}
                        <div className={cn("min-w-0", n.readAt && "pl-3.5")}>
                          <p className="text-xs font-medium text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );

                  return n.link ? (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                      }}
                      className="block"
                    >
                      {body}
                    </Link>
                  ) : (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className="block w-full text-left"
                    >
                      {body}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
