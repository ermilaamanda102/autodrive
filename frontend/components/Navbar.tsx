"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  CarFront,
  Home,
  Info,
  LogIn,
  Menu,
  Sparkles,
  X,
} from "lucide-react";

// ==========================================
// NAVIGATION
// ==========================================

const links = [
  {
    href: "/",
    label: "Beranda",
    icon: Home,
  },
  {
    href: "/mobil",
    label: "Katalog Mobil",
    icon: CarFront,
  },
  {
    href: "/rekomendasi",
    label: "Rekomendasi",
    icon: Sparkles,
  },
  {
    href: "/tentang-kami",
    label: "Tentang Kami",
    icon: Info,
  },
];

const focusRing =
  "focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 " +
  "focus-visible:outline-blue-600";

// ==========================================
// NAVBAR
// ==========================================

export default function Navbar() {
  const pathname = usePathname();

  // Tombol "Masuk" tidak ditampilkan di area dashboard
  // (/dashboard/admin dan /dashboard/sales), karena
  // pengguna di sana sudah login.
  const hideLogin =
  pathname === "/login" ||
  pathname === "/dashboard" ||
  pathname.startsWith("/dashboard/");
  function isActive(href: string): boolean {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* BRAND LOGO */}

        <Link
          href="/"
          aria-label="AutoDrive Beranda"
          className={`group flex shrink-0 items-center gap-3 rounded-lg ${focusRing}`}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white shadow-md shadow-blue-700/15 transition group-hover:bg-blue-800">
            <CarFront size={25} strokeWidth={2} />
          </div>

          <div>
            <p className="text-xl font-extrabold leading-none tracking-tight text-blue-700 sm:text-2xl">
              AutoDrive
              <span className="text-amber-400">.</span>
            </p>

            <p className="mt-1 hidden text-[10px] font-medium tracking-wider text-slate-500 sm:block">
              SMART AUTOMOTIVE PLATFORM
            </p>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}

        <nav
          aria-label="Menu utama"
          className="hidden items-center gap-1 lg:flex"
        >
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "relative inline-flex items-center gap-2",
                  "rounded-xl px-4 py-3 text-sm font-semibold",
                  "transition-colors duration-200",
                  focusRing,
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-700",
                ].join(" ")}
              >
                <Icon
                  size={17}
                  strokeWidth={active ? 2.3 : 1.8}
                />

                {link.label}

                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-amber-400"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT ACTIONS */}

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">

          {/* LOGIN BUTTON (disembunyikan di dashboard) */}

          {!hideLogin && (
            <Link
              href="/login"
              className={[
                "inline-flex items-center justify-center gap-2",
                "rounded-xl bg-amber-400 px-4 py-3",
                "text-sm font-bold text-slate-950",
                "shadow-sm transition hover:bg-amber-300",
                "active:scale-[0.98] sm:px-5",
                focusRing,
              ].join(" ")}
            >
              <LogIn size={17} />

              <span>Masuk</span>

              <ArrowUpRight
                size={15}
                className="hidden sm:block"
              />
            </Link>
          )}

          {/* MOBILE NAVIGATION */}

          <details
            key={pathname}
            className="group relative lg:hidden"
          >
            <summary
              aria-label="Buka atau tutup menu navigasi"
              className={[
                "flex h-11 w-11 cursor-pointer",
                "list-none items-center justify-center",
                "rounded-xl border border-slate-200",
                "bg-white text-slate-700",
                "transition hover:bg-slate-50",
                "[&::-webkit-details-marker]:hidden",
                focusRing,
              ].join(" ")}
            >
              <Menu
                size={22}
                className="group-open:hidden"
                aria-hidden="true"
              />

              <X
                size={22}
                className="hidden group-open:block"
                aria-hidden="true"
              />
            </summary>

            {/* MOBILE DROPDOWN */}

            <nav
              aria-label="Menu mobile"
              className="absolute right-0 top-14 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            >
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Navigasi AutoDrive
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Temukan kendaraan pilihanmu.
                </p>
              </div>

              <div className="space-y-1 p-3">
                {links.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={
                        active ? "page" : undefined
                      }
                      onClick={(event) => {
                        const details =
                          event.currentTarget.closest(
                            "details"
                          );

                        if (details) {
                          details.open = false;
                        }
                      }}
                      className={[
                        "flex items-center gap-3",
                        "rounded-xl px-4 py-3",
                        "text-sm font-semibold transition",
                        focusRing,
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-blue-700",
                      ].join(" ")}
                    >
                      <Icon size={19} />

                      <span className="flex-1">
                        {link.label}
                      </span>

                      {active && (
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 rounded-full bg-amber-400"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                <p className="text-xs leading-5 text-slate-500">
                  Katalog digital dan rekomendasi
                  kendaraan berbasis metode SAW.
                </p>
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}