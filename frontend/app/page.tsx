import Link from "next/link";
import Image from "next/image";

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

type CarsResponse = {
  status: string;
  message?: string;
  total?: number;
  data: Car[];
};

// Mencegah halaman Beranda diprerender sebagai
// halaman statis pada konfigurasi Cache Components.
export const instant = false;

// ==========================================
// FETCH CARS FROM GOLANG
// ==========================================

async function getCars(): Promise<{
  cars: Car[];
  error: string | null;
}> {
  const apiUrl = process.env.API_URL || "http://127.0.0.1:8080";

  try {
    const response = await fetch(`${apiUrl}/api/cars`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API mengembalikan HTTP ${response.status}`);
    }

    const result: CarsResponse = await response.json();

    if (result.status !== "success" || !Array.isArray(result.data)) {
      throw new Error("Format data dari API tidak valid");
    }

    return {
      cars: result.data.filter((car) => car.status === "available"),
      error: null,
    };
  } catch (error) {
    console.error("Gagal mengambil mobil untuk Beranda:", error);

    return {
      cars: [],
      error:
        "Data mobil belum dapat dimuat. Silakan coba beberapa saat lagi.",
    };
  }
}

// ==========================================
// HELPERS
// ==========================================

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${className}`}
    >
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

function Spec({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold capitalize text-slate-800">
        {value}
      </dd>
    </div>
  );
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

// ==========================================
// HOME PAGE
// ==========================================

export default async function Home() {
  const { cars, error } = await getCars();

  const featured = cars[0];
  const showcase = cars.slice(0, 6);
  const cheapest = cars.length ? Math.min(...cars.map((c) => c.price)) : 0;
  const brandCount = new Set(cars.map((c) => c.brand)).size;

  return (
    <main className="bg-white text-slate-900">
      {/* ===================================== */}
      {/* HERO */}
      {/* ===================================== */}

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 20%, rgba(29,78,216,0.55), transparent 45%)",
          }}
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24">
          <div>
            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Mobil yang pas untuk jalan Anda.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
              Bandingkan unit yang tersedia di showroom kami, lihat
              spesifikasi dan harganya, lalu jadwalkan test drive.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/mobil"
                className={`inline-flex items-center gap-2 rounded-lg bg-amber-400 px-7 py-4 font-bold text-slate-950 transition hover:bg-amber-300 ${focusRing}`}
              >
                Lihat katalog mobil
                <Arrow />
              </Link>

              <Link
                href="/rekomendasi"
                className={`rounded-lg border border-white/30 px-7 py-4 font-semibold text-white transition hover:bg-white/10 ${focusRing}`}
              >
                Cari rekomendasi
              </Link>
            </div>
          </div>

          {/* Featured car dari data asli */}
          {featured ? (
            <Link
              href={`/mobil/${featured.id}`}
              className={`group relative block overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/10 ${focusRing}`}
            >
              <div className="relative aspect-[4/3]">
                {featured.image_url ? (
                  <Image
                    src={featured.image_url}
                    alt={`${featured.brand} ${featured.model}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Foto belum tersedia
                  </div>
                )}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"
                />
              </div>

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                <div>
                  <p className="text-sm text-slate-300">
                    Unit pilihan, tahun {featured.year}
                  </p>
                  <p className="mt-1 text-xl font-bold sm:text-2xl">
                    {featured.brand} {featured.model}
                  </p>
                </div>
                <p className="shrink-0 rounded-lg bg-white px-4 py-2 text-base font-bold text-blue-700 sm:text-lg">
                  {formatRupiah(featured.price)}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-white/20 text-sm text-slate-400">
              Unit pilihan akan tampil di sini
            </div>
          )}
        </div>

        {/* Marka jalan sebagai pembatas */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 border-t-4 border-dashed border-amber-400/70"
        />
      </section>

      {/* ===================================== */}
      {/* RINGKASAN STOK (data asli) */}
      {/* ===================================== */}

      {!error && cars.length > 0 && (
        <section className="border-b border-slate-200 bg-slate-50 px-6 py-8">
          <dl className="mx-auto flex max-w-7xl flex-wrap gap-x-14 gap-y-5">
            <div>
              <dt className="text-sm text-slate-500">Unit tersedia</dt>
              <dd className="text-2xl font-bold">{cars.length} mobil</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Merek</dt>
              <dd className="text-2xl font-bold">{brandCount} merek</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Harga mulai dari</dt>
              <dd className="text-2xl font-bold text-blue-700">
                {formatRupiah(cheapest)}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {/* ===================================== */}
      {/* KATALOG */}
      {/* ===================================== */}

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Mobil yang siap Anda bawa pulang
              </h2>
              <p className="mt-3 max-w-lg text-slate-500">
                Semua unit di bawah ini berstatus tersedia dan bisa dilihat
                langsung di showroom.
              </p>
            </div>

            <Link
              href="/mobil"
              className={`inline-flex items-center gap-2 font-semibold text-blue-700 hover:underline ${focusRing}`}
            >
              Lihat semua mobil
              <Arrow />
            </Link>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-10 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"
            >
              {error}
            </div>
          )}

          {!error && cars.length === 0 && (
            <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <h3 className="text-xl font-bold">Belum ada mobil tersedia</h3>
              <p className="mt-3 text-slate-500">
                Unit baru akan muncul di sini begitu ditambahkan oleh admin.
              </p>
            </div>
          )}

          {!error && showcase.length > 0 && (
            <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map((car) => (
                <Link
                  key={car.id}
                  href={`/mobil/${car.id}`}
                  className={`group block ${focusRing}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                    {car.image_url ? (
                      <Image
                        src={car.image_url}
                        alt={`${car.brand} ${car.model}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Foto belum tersedia
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {car.year}
                    </span>
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold leading-snug group-hover:text-blue-700">
                      {car.brand} {car.model}
                    </h3>
                    <p className="shrink-0 text-lg font-bold text-blue-700">
                      {formatRupiah(car.price)}
                    </p>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                    {car.description ||
                      "Unit terawat dan siap untuk test drive."}
                  </p>

                  <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-200 pt-4">
                    <Spec label="Transmisi" value={car.transmission} />
                    <Spec label="Bahan bakar" value={car.fuel_type} />
                    <Spec label="Kapasitas" value={`${car.seats} kursi`} />
                  </dl>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===================================== */}
      {/* REKOMENDASI (urutan langkah) */}
      {/* ===================================== */}

      <section className="bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Bingung memilih? Biar kami bantu menyaring.
            </h2>
            <p className="mt-5 max-w-md leading-8 text-slate-300">
              Cukup jawab beberapa pertanyaan, dan kami tunjukkan mobil yang
              cocok dengan dana dan kebutuhan Anda.
            </p>
            <Link
              href="/rekomendasi"
              className={`mt-8 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-7 py-4 font-bold text-slate-950 transition hover:bg-amber-300 ${focusRing}`}
            >
              Mulai rekomendasi
              <Arrow />
            </Link>
          </div>

          <ol className="space-y-4">
            {[
              {
                title: "Tentukan anggaran",
                desc: "Masukkan kisaran harga yang nyaman untuk Anda.",
              },
              {
                title: "Pilih kebutuhan",
                desc: "Jumlah penumpang, jenis transmisi, dan bahan bakar.",
              },
              {
                title: "Lihat hasilnya",
                desc: "Daftar mobil yang paling sesuai langsung ditampilkan.",
              },
            ].map((step, i) => (
              <li
                key={step.title}
                className="flex gap-5 rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {step.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===================================== */}
      {/* KEUNGGULAN */}
      {/* ===================================== */}

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="max-w-xl text-3xl font-bold tracking-tight">
            Beli mobil tanpa menebak-nebak
          </h2>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              {
                title: "Spesifikasi jelas",
                desc: "Tahun, transmisi, bahan bakar, dan kapasitas kursi tertulis di setiap unit.",
              },
              {
                title: "Mudah dibandingkan",
                desc: "Cari berdasarkan harga, merek, dan spesifikasi sampai ketemu yang cocok.",
              },
              {
                title: "Disesuaikan kebutuhan",
                desc: "Rekomendasi dibuat dari anggaran dan preferensi Anda, bukan dari stok yang menumpuk.",
              },
            ].map((item) => (
              <div key={item.title} className="border-l-4 border-blue-700 pl-6">
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}