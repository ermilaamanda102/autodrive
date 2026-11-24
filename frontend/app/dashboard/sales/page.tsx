
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CarFront,
  CircleCheck,
  CircleDollarSign,
  ArrowRight,
  ClipboardList,
} from "lucide-react";

import { getCurrentUser } from "../../../lib/auth";

export const instant = false;

type Car = {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  transmission: string;
  seats: number;
  status: string;
};

function rupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

async function getCars(): Promise<{
  cars: Car[];
  error: string | null;
}> {
  const baseUrl =
    process.env.API_URL || "http://127.0.0.1:8080";

  try {
    const response = await fetch(
      `${baseUrl}/api/cars`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(
        `Backend mengembalikan HTTP ${response.status}`
      );
    }

    const result = await response.json();

    if (!Array.isArray(result?.data)) {
      throw new Error(
        "Format data kendaraan tidak valid."
      );
    }

    return {
      cars: result.data,
      error: null,
    };
  } catch (error) {
    return {
      cars: [],
      error:
        error instanceof Error
          ? error.message
          : "Gagal memuat data kendaraan.",
    };
  }
}

export default async function SalesDashboardPage() {
  // ==========================================
  // AUTHENTICATION & AUTHORIZATION
  // ==========================================

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "sales") {
    redirect("/dashboard");
  }

  // ==========================================
  // LOAD INVENTORY
  // ==========================================

  const { cars, error } = await getCars();

  const available = cars.filter(
    (car) => car.status === "available"
  );

  const sold = cars.filter(
    (car) => car.status === "sold"
  );

  const inventoryValue = available.reduce(
    (total, car) => total + car.price,
    0
  );

  const stats = [
    {
      label: "Total Mobil",
      value: String(cars.length),
      icon: CarFront,
    },
    {
      label: "Mobil Tersedia",
      value: String(available.length),
      icon: CircleCheck,
    },
    {
      label: "Mobil Terjual",
      value: String(sold.length),
      icon: ClipboardList,
    },
    {
      label: "Nilai Inventaris Tersedia",
      value: rupiah(inventoryValue),
      icon: CircleDollarSign,
    },
  ];

  return (
    <div className="space-y-7 text-slate-900">
      {/* HEADER */}

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
          Sales Workspace
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Dashboard Sales
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Pantau kendaraan showroom dan bantu pembeli
          menemukan mobil sesuai kebutuhannya.
        </p>
      </div>

      {/* API ERROR */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          Data inventaris belum dapat dimuat: {error}
        </div>
      )}

      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon size={22} />
              </div>

              <p className="mt-5 text-sm text-slate-500">
                {stat.label}
              </p>

              <p className="mt-2 break-words text-xl font-bold text-slate-900">
                {error ? "—" : stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* QUICK ACTIONS */}

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/mobil"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300"
        >
          <CarFront
            size={26}
            className="text-blue-700"
          />

          <h2 className="mt-4 text-lg font-bold">
            Katalog Mobil
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Lihat kendaraan yang tersedia beserta
            spesifikasi dan harganya.
          </p>

          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
            Buka Katalog
            <ArrowRight size={16} />
          </span>
        </Link>

        <Link
          href="/rekomendasi"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300"
        >
          <CircleCheck
            size={26}
            className="text-blue-700"
          />

          <h2 className="mt-4 text-lg font-bold">
            Rekomendasi SAW
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Gunakan sistem pendukung keputusan untuk
            membantu memilih kendaraan.
          </p>

          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
            Buka Rekomendasi
            <ArrowRight size={16} />
          </span>
        </Link>
      </div>

      {/* INVENTORY TABLE */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-bold">
            Inventaris Kendaraan
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Daftar kendaraan yang dapat dilihat oleh Sales.
          </p>
        </div>

        {error ? (
          <p className="p-6 text-sm text-slate-600">
            Inventaris belum tersedia karena koneksi API
            mengalami masalah.
          </p>
        ) : cars.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">
            Belum ada kendaraan dalam katalog.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4">
                    Kendaraan
                  </th>
                  <th className="px-5 py-4">
                    Tahun
                  </th>
                  <th className="px-5 py-4">
                    Harga
                  </th>
                  <th className="px-5 py-4">
                    Status
                  </th>
                  <th className="px-5 py-4">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {cars.map((car) => (
                  <tr key={car.id}>
                    <td className="px-5 py-4 font-semibold">
                      {car.brand} {car.model}
                    </td>

                    <td className="px-5 py-4">
                      {car.year}
                    </td>

                    <td className="px-5 py-4">
                      {rupiah(car.price)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          car.status === "available"
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800"
                            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        }
                      >
                        {car.status === "available"
                          ? "Tersedia"
                          : car.status === "sold"
                            ? "Terjual"
                            : car.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/mobil/${car.id}`}
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
