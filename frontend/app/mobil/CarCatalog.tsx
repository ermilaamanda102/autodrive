
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
  image_url: string | null;
};

type Props = {
  cars: Car[];
};

export default function CarCatalog({ cars }: Props) {
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState("all");
  const [transmission, setTransmission] = useState("all");
  const [fuel, setFuel] = useState("all");

  // Filter mobil
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const name = `${car.brand} ${car.model}`.toLowerCase();

      const matchSearch = name.includes(search.toLowerCase());

      const matchPrice =
        maxPrice === "all" || car.price <= Number(maxPrice);

      const matchTransmission =
        transmission === "all" ||
        car.transmission === transmission;

      const matchFuel =
        fuel === "all" || car.fuel_type === fuel;

      return (
        matchSearch &&
        matchPrice &&
        matchTransmission &&
        matchFuel
      );
    });
  }, [cars, search, maxPrice, transmission, fuel]);

  // Format Rupiah
  const formatRupiah = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div>
      {/* PENCARIAN */}
      <div className="mt-8">
        <input
          type="text"
          placeholder="Cari merek atau model mobil..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-900 outline-none focus:border-blue-600"
        />
      </div>

      {/* FILTER */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">

        <select
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white p-3 text-slate-700"
        >
          <option value="all">Semua Harga</option>
          <option value="150000000">Maksimal Rp150 juta</option>
          <option value="200000000">Maksimal Rp200 juta</option>
          <option value="250000000">Maksimal Rp250 juta</option>
          <option value="300000000">Maksimal Rp300 juta</option>
        </select>

        <select
          value={transmission}
          onChange={(e) => setTransmission(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white p-3 text-slate-700"
        >
          <option value="all">Semua Transmisi</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>

        <select
          value={fuel}
          onChange={(e) => setFuel(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white p-3 text-slate-700"
        >
          <option value="all">Semua Bahan Bakar</option>
          <option value="Bensin">Bensin</option>
          <option value="Diesel">Diesel</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Listrik">Listrik</option>
        </select>

      </div>

      {/* JUMLAH MOBIL */}
      <p className="mt-6 text-sm text-slate-500">
        Menampilkan {filteredCars.length} mobil
      </p>

      {/* DAFTAR MOBIL */}
      <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {filteredCars.map((car) => {
          const imageUrl = car.image_url?.trim();

          return (
            <CarCard
              key={car.id}
              car={car}
              imageUrl={imageUrl || ""}
              formatRupiah={formatRupiah}
            />
          );
        })}

      </div>

      {/* JIKA MOBIL TIDAK DITEMUKAN */}
      {filteredCars.length === 0 && (
        <div className="mt-10 rounded-xl bg-white p-10 text-center">
          <h3 className="text-lg font-semibold text-slate-800">
            Mobil tidak ditemukan
          </h3>

          <p className="mt-2 text-slate-500">
            Coba ubah kata pencarian atau filter mobil.
          </p>
        </div>
      )}

    </div>
  );
}

// KOMPONEN KARTU MOBIL
function CarCard({
  car,
  imageUrl,
  formatRupiah,
}: {
  car: Car;
  imageUrl: string;
  formatRupiah: (price: number) => string;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

      {/* FOTO MOBIL */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-100">

        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={`${car.brand} ${car.model}`}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-300 hover:scale-105"
            onError={() => {
  console.error("Gagal memuat gambar mobil:", {
    id: car.id,
    mobil: `${car.brand} ${car.model}`,
    imageUrl,
  });

  setImageError(true);
}}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <span className="text-3xl">!</span>
            <span className="text-sm">
              {imageUrl
                ? "Gambar gagal dimuat"
                : "Foto mobil belum tersedia"}
            </span>
          </div>
        )}

      </div>

      {/* INFORMASI MOBIL */}
      <div className="p-6">

        <p className="text-sm font-medium text-blue-700">
          {car.brand}
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-900">
          {car.model}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Tahun {car.year}
        </p>

        <p className="mt-4 text-xl font-bold text-blue-700">
          {formatRupiah(car.price)}
        </p>

        {/* SPESIFIKASI */}
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p>Transmisi: {car.transmission}</p>
          <p>Bahan bakar: {car.fuel_type}</p>
          <p>Kapasitas: {car.seats} penumpang</p>
        </div>

        {/* DESKRIPSI */}
        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          {car.description}
        </p>

        {/* DETAIL */}
        <Link
          href={`/mobil/${car.id}`}
          className="mt-6 block rounded-lg bg-blue-700 px-4 py-3 text-center font-medium text-white transition hover:bg-blue-800"
        >
          Lihat Detail
        </Link>

      </div>

    </article>
  );
}
