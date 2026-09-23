"use client";

import { useState } from "react";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import { NotificationsIcon, LoadsIcon, BillingIcon, FleetIcon, DriversIcon } from "@/components/icons";
import { mockNotifications } from "@/lib/mock/notifications";
import { formatRelativeTime } from "@/lib/format";
import type { NotificationItem, NotificationType } from "@/types";

const T = APP_TEXT.notifications;

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = notifications.filter((n) => filter === "all" || !n.read);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div>
      <PageHeader
        title={T.title}
        subtitle={T.subtitle}
        action={
          <button
            onClick={markAllRead}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {T.markAllRead}
          </button>
        }
      />

      <div className="flex gap-1.5 mb-4">
        {(["all", "unread"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              filter === key
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-600/25"
                : "bg-slate-100 hover:bg-slate-200 opacity-70 hover:opacity-100"
            }`}
          >
            {T.filters[key]}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-blue-600/5 dark:divide-blue-400/5 overflow-hidden">
        {filtered.map((n) => {
          const Icon = TYPE_ICON[n.type] ?? NotificationsIcon;
          return (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`w-full flex items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-blue-50/60 ${
                !n.read ? "bg-blue-500/[0.03]" : ""
              }`}
            >
              <span className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${LEVEL_STYLE[n.level]}`}>
                <Icon className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{n.title}</span>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                </div>
                <p className="text-sm opacity-70 mt-0.5">{n.message}</p>
                <p className="text-xs opacity-40 mt-1.5">{formatRelativeTime(n.created_at)}</p>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm opacity-50">{T.emptyState}</div>
        )}
      </div>
    </div>
  );
}
