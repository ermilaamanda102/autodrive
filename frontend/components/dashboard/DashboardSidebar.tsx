"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CarFront,
  ClipboardList,
  Briefcase,
  Home,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

type DashboardSidebarProps = {
  name: string;
  role: string;
};

type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
  // true = aktif hanya jika path persis sama
  exact?: boolean;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const menuSections: MenuSection[] = [
  {
    title: "Dashboard",
    items: [
      {
        label: "Dashboard Utama",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "sales", "buyer"],
        exact: true,
      },
      {
        label: "Dashboard Admin",
        href: "/dashboard/admin",
        icon: ShieldCheck,
        roles: ["admin"],
        exact: true,
      },
      {
        label: "Dashboard Sales",
        href: "/dashboard/sales",
        icon: Briefcase,
        roles: ["sales"],
        exact: true,
      },
      {
        label: "Dashboard Pembeli",
        href: "/dashboard/pembeli",
        icon: UserRound,
        roles: ["buyer"],
        exact: true,
      },
    ],
  },
  {
    title: "Kelola",
    items: [
      {
        label: "Manajemen Mobil",
        href: "/dashboard/admin/mobil",
        icon: ClipboardList,
        roles: ["admin"],
      },
    ],
  },
  {
    title: "Pengajuan",
    items: [
      {
        label: "Pengajuan Saya",
        href: "/dashboard/pembeli/pengajuan",
        icon: ClipboardList,
        roles: ["buyer"],
      },
      {
        label: "Pengajuan Pembeli",
        href: "/dashboard/sales/pengajuan",
        icon: ClipboardList,
        roles: ["sales"],
      },
    ],
  },
  {
    title: "Jelajahi",
    items: [
      {
        label: "Beranda",
        href: "/",
        icon: Home,
        roles: ["admin", "sales", "buyer"],
        exact: true,
      },
      {
        label: "Katalog Mobil",
        href: "/mobil",
        icon: LayoutGrid,
        roles: ["admin", "sales", "buyer"],
      },
      {
        label: "Rekomendasi SAW",
        href: "/rekomendasi",
        icon: Sparkles,
        roles: ["admin", "sales", "buyer"],
      },
    ],
  },
];

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  sales: "Sales",
  buyer: "Pembeli",
};

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default function DashboardSidebar({
  name,
  role,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  // Hanya tampilkan section yang punya menu untuk role ini.
  const visibleSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  // Tutup drawer dengan tombol Escape dan kunci scroll saat terbuka.
  useEffect(() => {
    if (!mobileOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function isActive(item: MenuItem) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        throw new Error("Gagal keluar dari akun. Coba lagi.");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Gagal keluar dari akun."
      );
      setLoggingOut(false);
    }
  }

  return (
    <div className="w-full lg:w-64 lg:shrink-0">
      {/* TOP BAR (MOBILE) */}

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white">
            <CarFront size={19} />
          </div>
          <span className="text-base font-bold text-slate-900">
            AutoDrive<span className="text-amber-400">.</span>
          </span>
        </div>

        <button
          type="button"
          aria-label="Buka menu"
          aria-expanded={mobileOpen}
          aria-controls="dashboard-sidebar"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* BACKDROP (MOBILE) */}

      <button
        type="button"
        aria-label="Tutup menu"
        tabIndex={-1}
        onClick={() => setMobileOpen(false)}
        className={[
          "fixed inset-0 z-40 bg-slate-900/40 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* SIDEBAR: drawer di mobile, sticky di desktop */}

      <aside
        id="dashboard-sidebar"
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto",
          "border-r border-slate-200 bg-white p-4 shadow-xl transition-transform duration-200",
          "lg:sticky lg:inset-auto lg:top-6 lg:z-auto lg:h-[calc(100vh-3rem)] lg:w-full",
          "lg:translate-x-0 lg:rounded-2xl lg:border lg:shadow-sm",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* BRAND */}

        <div className="flex items-center justify-between px-2 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
              <CarFront size={22} />
            </div>

            <div className="leading-tight">
              <h2 className="text-base font-extrabold text-slate-900">
                AutoDrive<span className="text-amber-400">.</span>
              </h2>
              <p className="text-xs text-slate-500">
                {roleLabels[role] ?? "Dashboard"}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* MENU */}

        <nav
          aria-label="Menu dashboard"
          className="flex-1 space-y-6 overflow-y-auto border-t-2 border-dashed border-amber-400/60 pt-5"
        >
          {visibleSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-xs font-semibold text-slate-400">
                {section.title}
              </p>

              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600",
                          active
                            ? "bg-blue-50 font-semibold text-blue-700"
                            : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        ].join(" ")}
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-amber-400"
                          />
                        )}

                        <Icon
                          size={18}
                          strokeWidth={active ? 2.25 : 2}
                          className={
                            active
                              ? "text-blue-700"
                              : "text-slate-400 group-hover:text-slate-600"
                          }
                        />

                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* USER + LOGOUT */}

        <div className="mt-4 border-t border-slate-100 pt-4">
          {logoutError && (
            <p
              role="alert"
              className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              {logoutError}
            </p>
          )}

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-slate-950">
              {getInitials(name)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {name}
              </p>
              <p className="text-xs text-slate-500">
                {roleLabels[role] ?? "Pengguna"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Keluar akun"
              title="Keluar akun"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-50"
            >
              <LogOut size={18} />
            </button>
          </div>

          {loggingOut && (
            <p className="mt-2 text-center text-xs text-slate-500">
              Keluar...
            </p>
          )}

          <p className="mt-4 text-center text-xs text-slate-400">
            AutoDrive © 2026
          </p>
        </div>
      </aside>
    </div>
  );
}