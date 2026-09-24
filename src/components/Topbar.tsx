"use client";

import GlobalSearch from "@/components/GlobalSearch";
import AccountMenu from "@/components/AccountMenu";
import NotificationBell from "@/components/NotificationBell";
import { useSidebar } from "@/components/SidebarContext";
import { MenuIcon } from "@/components/icons";

export default function Topbar() {
  const { toggle } = useSidebar();
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="relative h-16 flex items-center justify-between gap-3 px-4 sm:px-6 shrink-0 bg-gradient-to-r from-blue-50 via-sky-50/70 to-indigo-50 shadow-[0_1px_0_rgba(37,99,235,0.08),0_4px_20px_rgba(37,99,235,0.06)] sticky top-0 z-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-16 left-1/3 w-56 h-56 rounded-full bg-blue-300/25 blur-3xl animate-blob" />
        <div
          className="absolute -bottom-20 right-1/4 w-56 h-56 rounded-full bg-indigo-300/20 blur-3xl animate-blob"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <div className="relative z-10 flex items-center gap-2 flex-1 min-w-0">
        <button
          onClick={toggle}
          className="lg:hidden shrink-0 flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/60 transition-colors"
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 max-w-md">
          <GlobalSearch />
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-4 shrink-0">
        <span className="text-sm opacity-50 whitespace-nowrap hidden sm:block">{today}</span>
        <NotificationBell />
        <AccountMenu />
      </div>
    </div>
  );
}
