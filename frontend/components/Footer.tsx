
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CarFront,
  ChartNoAxesCombined,
  ClipboardList,
  Headset,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

// ==========================================
// FOOTER NAVIGATION
// ==========================================

const navigationLinks = [
  {
    href: "/",
    label: "Beranda",
  },
  {
    href: "/mobil",
    label: "Katalog Mobil",
  },
  {
    href: "/rekomendasi",
    label: "Rekomendasi Mobil",
  },
  {
    href: "/tentang-kami",
    label: "Tentang Kami",
  },
];

const serviceLinks = [
  {
    href: "/mobil",
    label: "Pencarian Kendaraan",
  },
  {
    href: "/rekomendasi",
    label: "Rekomendasi SAW",
  },
  {
    href: "/mobil",
    label: "Konsultasi Kendaraan",
  },
  {
    href: "/dashboard/pembeli/pengajuan",
    label: "Riwayat Pengajuan",
  },
];

const focusRing =
  "focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 " +
  "focus-visible:outline-amber-400";

// ==========================================
// FOOTER
// ==========================================

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-white">

      {/* ==================================
          TOP ACCENT
      ================================== */}

      <div
        aria-hidden="true"
        className="h-1 bg-gradient-to-r from-blue-700 via-blue-500 to-amber-400"
      />

      {/* DECORATIVE BACKGROUND */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-blue-700/10 blur-3xl"
      />

      {/* ==================================
          CALL TO ACTION
      ================================== */}

      <div className="relative mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-900/50 to-blue-800/20 p-6 sm:p-8 lg:flex-row lg:items-center">

          <div className="flex items-start gap-4">
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300 sm:flex">
              <Sparkles size={28} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
                Rekomendasi Kendaraan
              </p>

              <h2 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
                Masih Bingung Memilih Mobil?
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Gunakan sistem rekomendasi AutoDrive
                untuk menemukan kendaraan berdasarkan
                kebutuhan dan anggaran Anda.
              </p>
            </div>
          </div>

          <Link
            href="/rekomendasi"
            className={[
              "inline-flex shrink-0 items-center justify-center gap-2",
              "rounded-xl bg-amber-400 px-5 py-3.5",
              "text-sm font-bold text-slate-950",
              "transition hover:bg-amber-300",
              focusRing,
            ].join(" ")}
          >
            Coba Rekomendasi
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* ==================================
          MAIN FOOTER CONTENT
      ================================== */}

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_0.8fr_1fr_1fr] lg:px-8">

        {/* BRAND INFORMATION */}

        <div>
          <Link
            href="/"
            aria-label="AutoDrive Beranda"
            className={`inline-flex items-center gap-3 rounded-lg ${focusRing}`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-white">
              <CarFront size={27} />
            </div>

            <div>
              <p className="text-2xl font-extrabold tracking-tight text-white">
                AutoDrive
                <span className="text-amber-400">.</span>
              </p>

              <p className="mt-0.5 text-[10px] font-medium tracking-wider text-slate-400">
                SMART AUTOMOTIVE PLATFORM
              </p>
            </div>
          </Link>

          <p className="mt-6 max-w-sm text-sm leading-7 text-slate-400">
            AutoDrive merupakan platform showroom
            digital yang membantu pembeli menemukan
            kendaraan sesuai kebutuhan dan anggaran
            melalui sistem rekomendasi berbasis data.
          </p>

          <div className="mt-6 flex items-start gap-3">
            <ShieldCheck
              size={21}
              className="shrink-0 text-blue-400"
            />

            <p className="text-xs leading-6 text-slate-400">
              Informasi kendaraan dan perhitungan
              rekomendasi yang dapat ditinjau secara
              transparan.
            </p>
          </div>
        </div>

        {/* NAVIGATION */}

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Navigasi
          </h3>

          <div className="mt-3 h-0.5 w-8 rounded-full bg-amber-400" />

          <nav
            aria-label="Navigasi footer"
            className="mt-6 flex flex-col gap-4"
          >
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "group inline-flex w-fit items-center gap-2",
                  "rounded text-sm text-slate-400",
                  "transition hover:text-white",
                  focusRing,
                ].join(" ")}
              >
                <ArrowRight
                  size={13}
                  className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-amber-400"
                />

                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* SERVICES */}

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Layanan Kami
          </h3>

          <div className="mt-3 h-0.5 w-8 rounded-full bg-amber-400" />

          <nav
            aria-label="Layanan AutoDrive"
            className="mt-6 flex flex-col gap-4"
          >
            {serviceLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={[
                  "group inline-flex w-fit items-center gap-2",
                  "rounded text-sm text-slate-400",
                  "transition hover:text-white",
                  focusRing,
                ].join(" ")}
              >
                <ArrowRight
                  size={13}
                  className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-amber-400"
                />

                {link.label}
              </Link>
            ))}
          </nav>

          {/* UPCOMING FEATURE */}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">
              Booking Test Drive
            </span>

            <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300">
              Dalam Pengembangan
            </span>
          </div>
        </div>

        {/* PLATFORM INFORMATION */}

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Keunggulan Platform
          </h3>

          <div className="mt-3 h-0.5 w-8 rounded-full bg-amber-400" />

          <div className="mt-6 space-y-5">

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <ChartNoAxesCombined size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Rekomendasi SAW
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Pemilihan mobil berdasarkan
                  empat kriteria penilaian.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Headset size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Konsultasi Sales
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Ajukan minat melalui halaman
                  detail kendaraan.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <ClipboardList size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Pantau Pengajuan
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Lihat perkembangan tindak lanjut
                  melalui Dashboard Pembeli.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================
          BOTTOM FOOTER
      ================================== */}

      <div className="relative border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 py-6 sm:px-6 md:flex-row lg:px-8">

          <div className="text-center md:text-left">
  <p className="text-sm text-slate-400">
    © 2026{" "}
    <span className="font-semibold text-slate-200">
      AutoDrive Showroom.
    </span>{" "}
    All rights reserved.
  </p>

  <p className="mt-2 text-xs text-slate-500">
    Sistem Pendukung Keputusan Pemilihan Mobil
    menggunakan Metode SAW.
  </p>
</div>

          <Link
            href="/tentang-kami"
            className={[
              "inline-flex items-center gap-2 rounded-lg",
              "border border-slate-700 px-4 py-2.5",
              "text-xs font-semibold text-slate-300",
              "transition hover:border-blue-500 hover:text-white",
              focusRing,
            ].join(" ")}
          >
            Tentang AutoDrive
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
