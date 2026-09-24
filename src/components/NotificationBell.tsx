"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import { NotificationsIcon, LoadsIcon, BillingIcon, FleetIcon, DriversIcon } from "@/components/icons";
import { mockNotifications } from "@/lib/mock/notifications";
import { formatRelativeTime } from "@/lib/format";
import type { NotificationItem, NotificationType } from "@/types";

const T = APP_TEXT.notifications;
const PREVIEW_COUNT = 6;

const TYPE_ICON: Record<NotificationType, typeof LoadsIcon> = {
  delay: LoadsIcon,
  document: DriversIcon,
  delivery: LoadsIcon,
  maintenance: FleetIcon,
  system: BillingIcon,
};

const LEVEL_STYLE: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function NotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const preview = notifications.slice(0, PREVIEW_COUNT);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function viewAll() {
    setOpen(false);
    router.push("/notifications");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-slate-500 hover:text-blue-600 hover:bg-white/70 transition-colors"
      >
        <NotificationsIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-semibold px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-20">
          <div className="px-4 py-3 border-b border-blue-600/10 dark:border-blue-400/10">
            <div className="text-sm font-semibold">{T.title}</div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-blue-600/5 dark:divide-blue-400/5">
            {preview.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? NotificationsIcon;
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-blue-50/60 ${
                    !n.read ? "bg-blue-500/[0.03]" : ""
                  }`}
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${LEVEL_STYLE[n.level]}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium truncate">{n.title}</span>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                    </div>
                    <p className="text-xs opacity-60 mt-0.5 line-clamp-1">{n.message}</p>
                    <p className="text-[10px] opacity-40 mt-1">{formatRelativeTime(n.created_at)}</p>
                  </div>
                </button>
              );
            })}

            {preview.length === 0 && (
              <div className="px-4 py-8 text-center text-xs opacity-50">{T.emptyState}</div>
            )}
          </div>

          <button
            onClick={viewAll}
            className="w-full px-4 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50/60 transition-colors border-t border-blue-600/10 dark:border-blue-400/10"
          >
            {T.viewAll}
          </button>
        </div>
      )}
    </div>
  );
}
