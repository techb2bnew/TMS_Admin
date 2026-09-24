"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { LogoutIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

function getInitial(email: string) {
  return email[0]?.toUpperCase() ?? "A";
}

export default function AccountMenu() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function confirmLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-sm font-semibold shrink-0 hover:ring-2 hover:ring-blue-600/30 transition-all"
      >
        {getInitial(email)}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-20">
          <div className="px-4 py-3 border-b border-blue-600/10 dark:border-blue-400/10">
            <div className="text-sm font-medium">Admin</div>
            <div className="text-xs opacity-50 truncate">{email}</div>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              setShowLogoutConfirm(true);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors"
          >
            <LogoutIcon className="w-4 h-4 opacity-60" />
            {APP_TEXT.nav.logout}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Log out?"
        message="You'll need to sign in again to access the admin panel."
        confirmLabel={APP_TEXT.nav.logout}
      />
    </div>
  );
}
