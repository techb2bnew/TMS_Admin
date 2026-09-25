"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import { NotificationsIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/format";

const T = APP_TEXT.notifications;
const PREVIEW_COUNT = 6;

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(PREVIEW_COUNT);
      if (!cancelled) setNotifications(data ?? []);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
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
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-blue-50/60 ${
                  !n.is_read ? "bg-blue-500/[0.03]" : ""
                }`}
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <NotificationsIcon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate">{n.title}</span>
                    {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                  </div>
                  <p className="text-xs opacity-60 mt-0.5 line-clamp-1">{n.message}</p>
                  <p className="text-[10px] opacity-40 mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
              </button>
            ))}

            {notifications.length === 0 && (
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
