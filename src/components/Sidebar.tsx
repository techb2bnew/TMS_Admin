"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useSidebar } from "@/components/SidebarContext";
import { createClient } from "@/lib/supabase/client";
import {
  DashboardIcon,
  LoadsIcon,
  DispatchIcon,
  DriversIcon,
  FleetIcon,
  TrackingIcon,
  BillingIcon,
  ReportsIcon,
  LogoutIcon,
  CloseIcon,
  CustomersIcon,
  ExpensesIcon,
  TeamIcon,
} from "@/components/icons";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/", label: APP_TEXT.nav.dashboard, Icon: DashboardIcon }],
  },
  {
    label: "Operations",
    items: [
      { href: "/customers", label: APP_TEXT.nav.customers, Icon: CustomersIcon },
      { href: "/loads", label: APP_TEXT.nav.loads, Icon: LoadsIcon },
      { href: "/dispatch", label: APP_TEXT.nav.dispatch, Icon: DispatchIcon },
      { href: "/tracking", label: APP_TEXT.nav.tracking, Icon: TrackingIcon },
    ],
  },
  {
    label: "Fleet",
    items: [
      { href: "/drivers", label: APP_TEXT.nav.drivers, Icon: DriversIcon },
      { href: "/fleet", label: APP_TEXT.nav.fleet, Icon: FleetIcon },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/billing", label: APP_TEXT.nav.billing, Icon: BillingIcon },
      { href: "/reports", label: APP_TEXT.nav.reports, Icon: ReportsIcon },
      { href: "/expenses", label: APP_TEXT.nav.expenses, Icon: ExpensesIcon },
    ],
  },
];

function getInitial(email: string) {
  return email[0]?.toUpperCase() ?? "A";
}

type NavItemProps = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: number;
  onNavigate: () => void;
};

function NavItem({ href, label, Icon, active, badge, onNavigate }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group relative flex items-center gap-2.5 rounded-lg pl-2 pr-3 py-2 text-sm font-medium tracking-tight transition-all duration-150 ${
        active
          ? "bg-white text-blue-700 shadow-[0_2px_10px_rgba(37,99,235,0.15)]"
          : "text-slate-600 hover:bg-white/60 hover:text-blue-700"
      }`}
    >
      <span
        className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-150 ${
          active
            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30"
            : "bg-white/70 text-slate-400 group-hover:bg-white group-hover:text-blue-600"
        }`}
      >
        <Icon className="w-4.5 h-4.5" />
      </span>
      <span className="flex-1 min-w-0 truncate">{label}</span>
      {Boolean(badge) && (
        <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-semibold px-1 shrink-0">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { open, setOpen } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function confirmLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed lg:sticky inset-y-0 lg:inset-auto lg:top-0 left-0 z-50 lg:z-auto w-72 lg:w-64 shrink-0 h-screen flex flex-col overflow-hidden bg-gradient-to-b from-blue-50 via-sky-50/70 to-indigo-50 shadow-[1px_0_0_rgba(37,99,235,0.08),6px_0_28px_rgba(37,99,235,0.08)] transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      <div
        className="pointer-events-none absolute -top-12 -left-16 w-56 h-56 rounded-full bg-blue-300/30 blur-3xl animate-blob"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-16 -right-16 w-56 h-56 rounded-full bg-indigo-300/25 blur-3xl animate-blob"
        style={{ animationDelay: "3s" }}
        aria-hidden
      />

      <div className="relative z-10 flex items-center gap-2.5 px-5 h-16 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:14px_14px]" />
        <span className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 text-white shrink-0">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
            <path d="M3 7a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9H4a1 1 0 0 1-1-1V7Z" stroke="currentColor" />
            <path d="M14 10h4.4a1 1 0 0 1 .8.4l2 2.67a1 1 0 0 1 .2.6V15a1 1 0 0 1-1 1H14v-6Z" stroke="currentColor" />
            <circle cx="7.5" cy="17.5" r="1.6" stroke="currentColor" />
            <circle cx="17" cy="17.5" r="1.6" stroke="currentColor" />
          </svg>
        </span>
        <span className="relative text-sm font-semibold text-white flex-1">{APP_TEXT.app.name}</span>
        <button
          onClick={() => setOpen(false)}
          className="relative lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Close menu"
        >
          <CloseIcon className="w-4.5 h-4.5" />
        </button>
      </div>

      <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5">
        {NAV_GROUPS.map((group, i) => (
          <div key={group.label} className={i > 0 ? "pt-2.5 border-t border-blue-900/[0.06]" : undefined}>
            <div className="px-2 mb-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400/90">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, Icon }) => (
                <NavItem
                  key={href}
                  href={href}
                  label={label}
                  Icon={Icon}
                  active={pathname === href}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="pt-2.5 border-t border-blue-900/[0.06]">
          <div className="px-2 mb-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400/90">
            Admin
          </div>
          <div className="space-y-0.5">
            <NavItem
              href="/team"
              label={APP_TEXT.nav.team}
              Icon={TeamIcon}
              active={pathname === "/team"}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      </nav>

      <div className="relative z-10 p-3 border-t border-blue-600/10 dark:border-blue-400/10">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-white/70 transition-colors">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-xs font-semibold shrink-0">
            {getInitial(email)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-700 truncate">Admin</div>
            <div className="text-[11px] text-slate-400 truncate">{email}</div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            title={APP_TEXT.nav.logout}
            className="flex items-center justify-center w-7 h-7 rounded-md opacity-50 hover:opacity-100 hover:bg-blue-600/10 dark:hover:bg-blue-400/10 transition-colors shrink-0"
          >
            <LogoutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Log out?"
        message="You'll need to sign in again to access the admin panel."
        confirmLabel={APP_TEXT.nav.logout}
      />
      </aside>
    </>
  );
}
