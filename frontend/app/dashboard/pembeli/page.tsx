
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CarFront,
  CircleCheck,
  Sparkles,
  Search,
  CalendarDays,
  Users,
} from "lucide-react";

import { getCurrentUser } from "../../../lib/auth";

export const instant = false;

// ==========================================
// TYPES
// ==========================================

type Car = {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  transmission: string;
  fuel_type: string;
  seats: number;
  status: string;
  image_url: string;
};

type CarResponse = {
  cars: Car[];
  error: string | null;
};

// ==========================================
// HELPERS
// ==========================================

function rupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function validCloudinaryUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com"
    );
  } catch {
    return false;
  }
}

// ==========================================
// LOAD CARS
// ==========================================

async function getCars(): Promise<CarResponse> {
  const baseUrl =
    process.env.API_URL || "http://127.0.0.1:8080";

  try {
    const response = await fetch(
      `${baseUrl}/api/cars`,
      {
        cache: "no-store",
      }
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
          : "Gagal memuat kendaraan.",
    };
  }
}

// ==========================================
// PAGE
// ==========================================

export default async function BuyerDashboardPage() {
  // ------------------------------------------
  // AUTHENTICATION
  // ------------------------------------------

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // ------------------------------------------
  // ROLE AUTHORIZATION
  // ------------------------------------------

  if (user.role !== "buyer") {
    redirect("/dashboard");
  }

  // ------------------------------------------
  // FETCH INVENTORY
  // ------------------------------------------

  const { cars, error } = await getCars();

  const availableCars = cars.filter(
    (car) => car.status === "available"
  );

  const soldCars = cars.filter(
    (car) => car.status === "sold"
  );

  // Hanya kendaraan tersedia yang direkomendasikan
  // untuk dijelajahi pembeli.
  const featuredCars = availableCars.slice(0, 6);

  const stats = [
    {
      label: "Total Mobil",
      value: cars.length,
      icon: CarFront,
    },
    {
      label: "Mobil Tersedia",
      value: availableCars.length,
      icon: CircleCheck,
    },
    {
      label: "Mobil Terjual",
      value: soldCars.length,
      icon: CalendarDays,
    },
  ];

  // ------------------------------------------
  // RENDER
  // ------------------------------------------

  return (
    <div className="space-y-8 text-slate-900">
      {/* WELCOME SECTION */}

      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-800 to-blue-600 p-7 text-white shadow-sm md:p-9">
        <p className="text-sm font-semibold text-blue-100">
          Dashboard Pembeli
        </p>

        <h1 className="mt-3 text-2xl font-bold md:text-3xl">
          Selamat Datang, {user.name}
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100">
          Temukan kendaraan yang sesuai kebutuhan dan
          anggaran. Gunakan sistem rekomendasi AutoDrive
          untuk membandingkan pilihan secara objektif
          berdasarkan kriteria yang kamu tentukan.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/mobil"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
          >
            <Search size={17} />
            Jelajahi Mobil
          </Link>

          <Link
            href="/rekomendasi"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <Sparkles size={17} />
            Rekomendasi SAW
          </Link>
        </div>
      </section>

      {/* ERROR */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          Gagal memuat inventaris kendaraan: {error}
        </div>
      )}

      {/* STATISTICS */}

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon size={22} />
              </div>

              <p className="mt-5 text-sm text-slate-500">
                {stat.label}
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {error ? "—" : stat.value}
              </p>
            </div>
          );
        })}
      </section>

      {/* QUICK ACTIONS */}

      <section>
        <div>
          <h2 className="text-xl font-bold">
            Mulai Pencarian Mobil
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Pilih cara yang paling sesuai untuk mencari
            kendaraan.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Link
            href="/mobil"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300"
          >
            <CarFront
              size={27}
              className="text-blue-700"
            />

            <h3 className="mt-4 text-lg font-bold">
              Katalog Kendaraan
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Lihat seluruh pilihan kendaraan beserta
              spesifikasi, harga, dan foto mobil.
            </p>

            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
              Lihat Katalog
              <ArrowRight size={16} />
            </span>
          </Link>

          <Link
            href="/rekomendasi"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300"
          >
            <Sparkles
              size={27}
              className="text-blue-700"
            />

            <h3 className="mt-4 text-lg font-bold">
              Rekomendasi Mobil SAW
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Tentukan anggaran, kapasitas kursi,
              transmisi, dan bobot kriteria untuk
              mendapatkan peringkat mobil.
            </p>

            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
              Mulai Rekomendasi
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </section>

      {/* FEATURED CARS */}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              Mobil yang Tersedia
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Jelajahi beberapa kendaraan yang tersedia
              di showroom AutoDrive.
            </p>
          </div>

          <Link
            href="/mobil"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
          >
            Lihat Semua
            <ArrowRight size={16} />
          </Link>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            Daftar kendaraan belum dapat dimuat.
          </div>
        ) : featuredCars.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            Belum ada kendaraan tersedia saat ini.
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredCars.map((car) => (
              <article
                key={car.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {/* CAR IMAGE */}

                <div className="relative h-48 bg-slate-100">
                  {car.image_url &&
                  validCloudinaryUrl(car.image_url) ? (
                    <Image
                      src={car.image_url}
                      alt={`${car.brand} ${car.model}`}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      Foto belum tersedia
                    </div>
                  )}
                </div>

                {/* CAR INFORMATION */}

                <div className="p-5">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                    Tersedia
                  </span>

                  <h3 className="mt-4 text-lg font-bold">
                    {car.brand} {car.model}
                  </h3>

                  <p className="mt-2 text-xl font-bold text-blue-700">
                    {rupiah(car.price)}
                  </p>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      Tahun {car.year}
                    </p>

                    <p className="flex items-center gap-2">
                      <Users size={16} />
                      {car.seats} kursi
                    </p>

                    <p className="flex items-center gap-2">
                      <CarFront size={16} />
                      {car.transmission}
                    </p>
                  </div>

                  <Link
                    href={`/mobil/${car.id}`}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    Lihat Detail Mobil
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* NEXT FEATURE NOTICE */}

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Fitur Pengajuan Minat Kendaraan
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-700">
          Pada tahap pengembangan berikutnya, pembeli
          dapat mengajukan minat terhadap kendaraan,
          memantau status pengajuan, dan menerima
          tindak lanjut dari tim Sales AutoDrive.
        </p>
      </section>
    </div>
  );
}
