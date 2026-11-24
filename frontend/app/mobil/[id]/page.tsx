
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Fuel,
  MessageCircle,
  Settings2,
  Users,
} from "lucide-react";

import { getCurrentUser } from "../../../lib/auth";

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
  description: string;
  status: string;
  image_url: string;
};

type CarApiResponse = {
  status: string;
  message?: string;
  data?: Car;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

// ==========================================
// HELPERS
// ==========================================

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function validImageUrl(value: string): boolean {
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
// FETCH CAR DETAIL
// ==========================================

async function getCar(id: string): Promise<Car | null> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "API_URL belum dikonfigurasi pada frontend."
    );
  }

  const response = await fetch(
    `${apiUrl.replace(/\/$/, "")}/api/cars/${id}`,
    {
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Gagal mengambil detail mobil (HTTP ${response.status}).`
    );
  }

  const result: CarApiResponse =
    await response.json();

  if (
    !result.data ||
    typeof result.data.id !== "number"
  ) {
    throw new Error(
      "Format data detail mobil tidak valid."
    );
  }

  return result.data;
}

// ==========================================
// PAGE
// ==========================================

export default async function DetailMobilPage({
  params,
}: PageProps) {
  // ----------------------------------------
  // VALIDATE ID
  // ----------------------------------------

  const { id } = await params;

  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    notFound();
  }

  // ----------------------------------------
  // LOAD DATA
  // ----------------------------------------

  const [car, user] = await Promise.all([
    getCar(id),
    getCurrentUser(),
  ]);

  if (!car) {
    notFound();
  }

  const carName = `${car.brand} ${car.model}`;

  const hasImage = validImageUrl(
    car.image_url ?? ""
  );

  const isAvailable = car.status === "available";

  const isBuyer = user?.role === "buyer";

  const contactHref = isBuyer
    ? `/mobil/${car.id}/ajukan`
    : user
      ? "/dashboard"
      : `/login?next=${encodeURIComponent(
          `/mobil/${car.id}/ajukan`
        )}`;

  // ----------------------------------------
  // SPECIFICATIONS
  // ----------------------------------------

  const specifications = [
    {
      label: "Tahun Produksi",
      value: String(car.year),
      icon: CalendarDays,
    },
    {
      label: "Transmisi",
      value: car.transmission,
      icon: Settings2,
    },
    {
      label: "Bahan Bakar",
      value: car.fuel_type,
      icon: Fuel,
    },
    {
      label: "Kapasitas Penumpang",
      value: `${car.seats} Penumpang`,
      icon: Users,
    },
  ];

  // ----------------------------------------
  // RENDER
  // ----------------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 md:py-12">
      <div className="mx-auto max-w-5xl">
        {/* BACK LINK */}

        <Link
          href="/mobil"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
        >
          <ArrowLeft size={17} />
          Kembali ke Katalog
        </Link>

        {/* CAR DETAIL CARD */}

        <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* CAR IMAGE */}

          <div className="relative flex h-64 items-center justify-center overflow-hidden bg-slate-100 sm:h-80 md:h-[420px]">
            {hasImage ? (
              <Image
                src={car.image_url}
                alt={`Foto ${carName}`}
                fill
                unoptimized
                priority
                sizes="(max-width: 768px) 100vw, 1024px"
                className="object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <CarFront size={48} />

                <p className="text-sm font-medium">
                  Foto mobil belum tersedia
                </p>
              </div>
            )}
          </div>

          {/* CAR INFORMATION */}

          <div className="p-6 md:p-8">
            {/* BRAND AND STATUS */}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                {car.brand}
              </p>

              {isAvailable ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-800">
                  <CheckCircle2 size={15} />
                  Tersedia
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  Tidak Tersedia
                </span>
              )}
            </div>

            {/* MODEL */}

            <h1 className="mt-3 text-2xl font-extrabold text-slate-900 md:text-3xl">
              {car.model}
            </h1>

            {/* PRICE */}

            <p className="mt-4 text-2xl font-extrabold text-blue-700 md:text-3xl">
              {formatRupiah(car.price)}
            </p>

            {/* SPECIFICATIONS */}

            <section className="mt-9">
              <h2 className="text-xl font-bold text-slate-900">
                Spesifikasi Mobil
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {specifications.map((spec) => {
                  const Icon = spec.icon;

                  return (
                    <div
                      key={spec.label}
                      className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <Icon size={20} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-600">
                          {spec.label}
                        </p>

                        <p className="mt-1 break-words text-base font-bold text-slate-900">
                          {spec.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* DESCRIPTION */}

            <section className="mt-9">
              <h2 className="text-xl font-bold text-slate-900">
                Deskripsi Mobil
              </h2>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {car.description?.trim() ||
                  "Belum ada deskripsi untuk kendaraan ini."}
              </p>
            </section>

            {/* CONTACT SALES */}

            <section className="mt-9 border-t border-slate-200 pt-7">
              <h2 className="text-lg font-bold text-slate-900">
                Tertarik dengan Mobil Ini?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Kirim pengajuan minat agar tim Sales
                AutoDrive dapat menindaklanjuti
                kebutuhan pembelian kendaraanmu.
              </p>

              {isAvailable ? (
                <>
                  <Link
                    href={contactHref}
                    className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-blue-700 px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  >
                    <MessageCircle size={19} />
                    Hubungi Sales
                    <ArrowRight size={18} />
                  </Link>

                  {!user && (
                    <p className="mt-3 text-center text-xs text-slate-500">
                      Login sebagai Pembeli diperlukan
                      untuk mengirim pengajuan minat.
                    </p>
                  )}

                  {user && !isBuyer && (
                    <p className="mt-3 text-center text-xs text-amber-700">
                      Pengajuan minat hanya tersedia
                      untuk akun Pembeli.
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-5 rounded-xl bg-slate-100 px-5 py-4 text-center text-sm font-semibold text-slate-600">
                  Kendaraan ini tidak tersedia untuk
                  pengajuan minat.
                </div>
              )}
            </section>
          </div>
        </article>

        {/* FOOTER ACTION */}

        <div className="mt-6 flex justify-center">
          <Link
            href="/mobil"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
          >
            <CarFront size={17} />
            Lihat Kendaraan Lainnya
          </Link>
        </div>
      </div>
    </main>
  );
}
