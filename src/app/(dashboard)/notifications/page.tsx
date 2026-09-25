"use client";

import { useEffect, useState } from "react";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import { NotificationsIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/format";

const T = APP_TEXT.notifications;

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setNotifications(data ?? []);
    }
    load();
  }, []);

  const filtered = notifications.filter((n) => filter === "all" || !n.is_read);

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
  }

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
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
        {filtered.map((n) => (
          <button
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`w-full flex items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-blue-50/60 ${
              !n.is_read ? "bg-blue-500/[0.03]" : ""
            }`}
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <NotificationsIcon className="w-4.5 h-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{n.title}</span>
                {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
              </div>
              <p className="text-sm opacity-70 mt-0.5">{n.message}</p>
              <p className="text-xs opacity-40 mt-1.5">{formatRelativeTime(n.created_at)}</p>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm opacity-50">{T.emptyState}</div>
        )}
      </div>
    </div>
  );
}
