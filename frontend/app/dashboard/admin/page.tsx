import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/auth";

export const instant = false;

const icons = {
  car: "M5 16v2m14-2v2M3 12l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 7l2 5v4H3v-4Zm4 1.5h.01M17 13.5h.01",
  users:
    "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m17 0v-1a4 4 0 0 0-3-3.9M14 4.1a4 4 0 0 1 0 7.8M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  receipt:
    "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
};

const menus: {
  title: string;
  description: string;
  icon: keyof typeof icons;
}[] = [
  {
    title: "Manajemen Mobil",
    description: "Kelola data dan stok mobil",
    icon: "car",
  },
  {
    title: "Manajemen Pengguna",
    description: "Kelola akun pengguna",
    icon: "users",
  },
  {
    title: "Transaksi",
    description: "Kelola transaksi penjualan",
    icon: "receipt",
  },
  {
    title: "Laporan",
    description: "Pantau aktivitas showroom",
    icon: "chart",
  },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const initial = (user.name ?? "A").charAt(0).toUpperCase();

  return (
    <main>
      {/* HEADER */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white sm:px-10 sm:py-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 90% 0%, rgba(29,78,216,0.6), transparent 50%)",
          }}
        />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xl font-extrabold text-slate-950"
            >
              {initial}
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Dashboard Admin
              </h1>
              <p className="mt-1 text-slate-300">
                Selamat datang, {user.name}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/mobil"
              className={`rounded-lg bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300 ${focusRing}`}
            >
              Lihat katalog
            </Link>
            <Link
              href="/"
              className={`rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 ${focusRing}`}
            >
              Buka beranda
            </Link>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 border-t-4 border-dashed border-amber-400/70"
        />
      </section>

      {/* MENU */}
      <section aria-labelledby="menu-admin" className="mt-10">
        <h2 id="menu-admin" className="text-xl font-bold text-slate-900">
          Menu pengelolaan
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Modul berikut akan aktif satu per satu seiring pengembangan.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {menus.map((menu) => (
            <article
              key={menu.title}
              className="flex gap-5 rounded-xl border border-slate-200 bg-white p-6"
            >
              <div
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d={icons[menu.icon]} />
                </svg>
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900">
                  {menu.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {menu.description}
                </p>
                <span className="mt-4 inline-block rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  Dalam pengembangan
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}