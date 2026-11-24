"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SAWCalculationDetails from "./SAWCalculationDetails";
import SAWSensitivityPanel from "./SAWSensitivityPanel";

type Criterion =
  | "price"
  | "year"
  | "seats"
  | "transmission";

type Values = Record<Criterion, number>;

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
  image_url: string;
};

type RankedCar = {
  rank: number;
  car: Car;
  raw: Values;
  normalized: Values;
  contributions: Values;
  score: number;
  reasons: string[];
};

type RecommendationData = {
  weights: Values;
  alternatives: number;
  normalization_basis?: {
    min_price: number;
    max_year: number;
    max_seats: number;
  };
  results: RankedCar[];
};

type Preferences = {
  max_budget: number;
  min_seats: number;
  transmission: string;
  weights: Values;
};

const criteria: {
  key: Criterion;
  label: string;
  code: string;
  type: "Cost" | "Benefit";
}[] = [
  {
    key: "price",
    label: "Harga",
    code: "C1",
    type: "Cost",
  },
  {
    key: "year",
    label: "Tahun Produksi",
    code: "C2",
    type: "Benefit",
  },
  {
    key: "seats",
    label: "Kapasitas Kursi",
    code: "C3",
    type: "Benefit",
  },
  {
    key: "transmission",
    label: "Kecocokan Transmisi",
    code: "C4",
    type: "Benefit",
  },
];

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 " +
  "bg-white px-4 py-3 text-sm text-slate-900 " +
  "outline-none focus:border-blue-600 " +
  "focus:ring-2 focus:ring-blue-100";

function rupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function decimal(value: number): string {
  return Number.isFinite(value)
    ? value.toFixed(4).replace(".", ",")
    : "-";
}

function formatRaw(
  key: Criterion,
  value: number
): string {
  if (key === "price") {
    return rupiah(value);
  }

  if (key === "transmission") {
    return decimal(value);
  }

  return String(value);
}

function formatNumber(value: string): string {
  if (!value) return "";

  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function validCloudinaryImage(value: string): boolean {
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
// IMAGE PREVIEW
// ==========================================

function CarPhoto({
  url,
  name,
}: {
  url: string;
  name: string;
}) {
  const [failedUrl, setFailedUrl] = useState("");

  const valid = validCloudinaryImage(url);
  const failed = failedUrl === url;

  return (
    <div className="relative h-52 overflow-hidden bg-slate-100">
      {valid && !failed ? (
        <Image
          src={url}
          alt={`Foto ${name}`}
          fill
          unoptimized
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center px-4 text-center">
          <p className="text-sm font-semibold text-slate-500">
            Foto mobil belum tersedia
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Gambar kendaraan tidak ditemukan.
          </p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// RECOMMENDATION FORM
// ==========================================

export default function RecommendationForm() {
  // Budget kosong berarti tanpa batas.
  const [budgetInput, setBudgetInput] = useState("");

  const [minSeats, setMinSeats] = useState(0);
  const [transmission, setTransmission] =
    useState("any");

  const [weights, setWeights] = useState<Values>({
    price: 40,
    year: 25,
    seats: 20,
    transmission: 15,
  });

  const [data, setData] =
    useState<RecommendationData | null>(null);

  const [
    submittedPreferences,
    setSubmittedPreferences,
  ] = useState<Preferences | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalWeight = Object.values(weights).reduce(
    (sum, value) => sum + value,
    0
  );

  // ==========================================
  // UPDATE BUDGET
  // ==========================================

  function handleBudgetChange(value: string) {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
      setBudgetInput("");
      return;
    }

    const normalized =
      digits.replace(/^0+/, "") || "0";

    if (!Number.isSafeInteger(Number(normalized))) {
      setError("Nilai anggaran terlalu besar.");
      return;
    }

    setBudgetInput(normalized);
    setError("");
  }

  // ==========================================
  // UPDATE WEIGHT
  // ==========================================

  function updateWeight(
    key: Criterion,
    value: number
  ) {
    setWeights((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  // ==========================================
  // RESET WEIGHTS
  // ==========================================

  function resetWeights() {
    setWeights({
      price: 40,
      year: 25,
      seats: 20,
      transmission: 15,
    });
  }

  // ==========================================
  // CALCULATE RECOMMENDATION
  // ==========================================

  async function calculate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    const budget = budgetInput
      ? Number(budgetInput)
      : 0;

    if (
      !Number.isSafeInteger(budget) ||
      budget < 0
    ) {
      setError("Anggaran tidak valid.");
      return;
    }

    if (
      !Number.isInteger(minSeats) ||
      minSeats < 0 ||
      minSeats > 100
    ) {
      setError("Jumlah kursi minimum tidak valid.");
      return;
    }

    if (
      !Object.values(weights).every(
        (value) =>
          Number.isFinite(value) && value >= 0
      ) ||
      totalWeight <= 0
    ) {
      setError(
        "Minimal satu bobot harus lebih dari nol."
      );
      return;
    }

    const preferences: Preferences = {
      max_budget: budget,
      min_seats: minSeats,
      transmission,
      weights: { ...weights },
    };

    setLoading(true);
    setError("");
    setData(null);
    setSubmittedPreferences(null);

    try {
      const response = await fetch(
        "/api/recommendations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preferences),
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof result?.message === "string"
            ? result.message
            : `Perhitungan gagal (HTTP ${response.status}).`
        );
      }

      if (
        !result?.data ||
        !Array.isArray(result.data.results) ||
        !result.data.weights
      ) {
        throw new Error(
          "Format hasil rekomendasi dari server tidak valid."
        );
      }

      setData(result.data);
      setSubmittedPreferences(preferences);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghitung rekomendasi."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-8 text-slate-900">
      {/* PREFERENCES FORM */}

      <form
        onSubmit={calculate}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Sistem Pendukung Keputusan
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Preferensi Pembelian Mobil
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Tentukan kebutuhan kendaraan dan prioritas
            kriteria. AutoDrive akan menghitung peringkat
            menggunakan metode Simple Additive Weighting
            (SAW).
          </p>
        </div>

        {/* BASIC PREFERENCES */}

        <div className="mt-8">
          <h3 className="text-lg font-bold text-slate-900">
            1. Kebutuhan Kendaraan
          </h3>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {/* BUDGET */}

            <div>
              <label
                htmlFor="budget"
                className="block text-sm font-semibold text-slate-800"
              >
                Anggaran Maksimal (Rp)
              </label>

              <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
                  Rp
                </span>

                <input
                  id="budget"
                  type="text"
                  inputMode="numeric"
                  value={formatNumber(budgetInput)}
                  onChange={(event) =>
                    handleBudgetChange(
                      event.target.value
                    )
                  }
                  placeholder="Tanpa batas"
                  className="w-full min-w-0 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Kosong atau 0 berarti tanpa batas.
              </p>
            </div>

            {/* MINIMUM SEATS */}

            <div>
              <label
                htmlFor="min-seats"
                className="block text-sm font-semibold text-slate-800"
              >
                Minimal Jumlah Kursi
              </label>

              <select
                id="min-seats"
                value={minSeats}
                onChange={(event) =>
                  setMinSeats(
                    Number(event.target.value)
                  )
                }
                className={inputClass}
              >
                <option value={0}>
                  Tidak dibatasi
                </option>
                <option value={2}>
                  Minimal 2 kursi
                </option>
                <option value={4}>
                  Minimal 4 kursi
                </option>
                <option value={5}>
                  Minimal 5 kursi
                </option>
                <option value={6}>
                  Minimal 6 kursi
                </option>
                <option value={7}>
                  Minimal 7 kursi
                </option>
                <option value={8}>
                  Minimal 8 kursi
                </option>
              </select>
            </div>

            {/* TRANSMISSION */}

            <div>
              <label
                htmlFor="transmission"
                className="block text-sm font-semibold text-slate-800"
              >
                Preferensi Transmisi
              </label>

              <select
                id="transmission"
                value={transmission}
                onChange={(event) =>
                  setTransmission(event.target.value)
                }
                className={inputClass}
              >
                <option value="any">
                  Semua Transmisi
                </option>
                <option value="manual">
                  Manual
                </option>
                <option value="automatic">
                  Automatic
                </option>
                <option value="cvt">
                  CVT
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* CRITERIA WEIGHTS */}

        <div className="mt-9 border-t border-slate-200 pt-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                2. Bobot Kriteria
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Atur tingkat kepentingan setiap kriteria.
                Bobot dinormalisasi otomatis oleh backend.
              </p>
            </div>

            <button
              type="button"
              onClick={resetWeights}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Reset Bobot
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {criteria.map((criterion) => (
              <div
                key={criterion.key}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor={`weight-${criterion.key}`}
                    className="text-sm font-semibold text-slate-800"
                  >
                    {criterion.label}
                  </label>

                  <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600">
                    {criterion.type}
                  </span>
                </div>

                <input
                  id={`weight-${criterion.key}`}
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={weights[criterion.key]}
                  onChange={(event) =>
                    updateWeight(
                      criterion.key,
                      Number(event.target.value)
                    )
                  }
                  disabled={loading}
                  className="mt-5 w-full accent-blue-700"
                />

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {criterion.code}
                  </span>

                  <span className="text-lg font-bold text-blue-700">
                    {weights[criterion.key]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* WEIGHT SUMMARY */}

          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800">
                Total Bobot Mentah
              </p>

              <p className="text-xl font-bold text-blue-700">
                {totalWeight}
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              Total tidak harus 100. Sistem membagi setiap
              bobot dengan jumlah keseluruhan sehingga
              total bobot normalisasi menjadi 1.
            </p>
          </div>
        </div>

        {/* SUBMIT */}

        <button
          type="submit"
          disabled={loading || totalWeight <= 0}
          className="mt-8 w-full rounded-xl bg-blue-700 px-6 py-4 text-base font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Menghitung rekomendasi..."
            : "Hitung Rekomendasi SAW"}
        </button>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}
      </form>

      {/* RESULTS */}

      {data && (
        <section className="space-y-7">
          {/* RESULTS HEADER */}

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Hasil Perhitungan
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Hasil Rekomendasi Mobil
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {data.alternatives} mobil memenuhi persyaratan.
              Peringkat dihitung berdasarkan nilai normalisasi
              dan bobot SAW.
            </p>
          </div>

          {/* SUBMITTED PREFERENCES */}

          {submittedPreferences && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900">
                Preferensi yang Dihitung
              </h3>

              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-slate-500">
                    Anggaran Maksimal
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {submittedPreferences.max_budget === 0
                      ? "Tanpa batas"
                      : rupiah(
                          submittedPreferences.max_budget
                        )}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Minimum Kursi
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {submittedPreferences.min_seats === 0
                      ? "Tidak dibatasi"
                      : `${submittedPreferences.min_seats} kursi`}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Transmisi
                  </p>

                  <p className="mt-1 font-semibold capitalize text-slate-900">
                    {submittedPreferences.transmission === "any"
                      ? "Semua Transmisi"
                      : submittedPreferences.transmission}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* EMPTY RESULT */}

          {data.results.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">
                Tidak Ada Mobil yang Memenuhi Kriteria
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Coba tingkatkan anggaran, kurangi
                persyaratan kursi, atau periksa kembali
                pilihan kendaraan yang tersedia.
              </p>
            </div>
          ) : (
            <>
              {/* TOP RECOMMENDATION */}

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Rekomendasi Peringkat Pertama
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-900">
                  {data.results[0].car.brand}{" "}
                  {data.results[0].car.model}
                </h3>

                <p className="mt-2 text-sm text-slate-700">
                  Skor SAW:{" "}
                  <strong>
                    {decimal(data.results[0].score)}
                  </strong>
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Peringkat tertinggi berdasarkan preferensi
                  dan alternatif yang memenuhi persyaratan.
                </p>
              </div>

              {/* RECOMMENDATION CARDS */}

              <div className="grid gap-5 lg:grid-cols-2">
                {data.results.map((item) => (
                  <article
                    key={item.car.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <CarPhoto
                      url={item.car.image_url ?? ""}
                      name={`${item.car.brand} ${item.car.model}`}
                    />

                    <div className="p-6">
                      {/* RANK AND SCORE */}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                          Peringkat #{item.rank}
                        </span>

                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            Skor SAW
                          </p>

                          <p className="text-xl font-bold text-blue-700">
                            {decimal(item.score)}
                          </p>
                        </div>
                      </div>

                      {/* CAR INFORMATION */}

                      <h3 className="mt-5 text-xl font-bold text-slate-900">
                        {item.car.brand} {item.car.model}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">
                        {item.car.year} •{" "}
                        {item.car.transmission} •{" "}
                        {item.car.seats} kursi
                      </p>

                      <p className="mt-4 text-xl font-bold text-slate-900">
                        {rupiah(item.car.price)}
                      </p>

                      {/* REASONS */}

                      <div className="mt-5 rounded-xl bg-blue-50 p-4">
                        <h4 className="font-bold text-slate-900">
                          Alasan Rekomendasi
                        </h4>

                        {item.reasons?.length > 0 ? (
                          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                            {item.reasons.map(
                              (reason, index) => (
                                <li key={index}>
                                  {reason}
                                </li>
                              )
                            )}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-slate-600">
                            Penjelasan belum tersedia.
                          </p>
                        )}
                      </div>

                      {/* INDIVIDUAL SAW DETAILS */}

                      <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                          Lihat Rincian Perhitungan SAW
                        </summary>

                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full min-w-[460px] text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-600">
                                <th className="py-3 pr-3">
                                  Kriteria
                                </th>
                                <th className="py-3 pr-3">
                                  Nilai Awal
                                </th>
                                <th className="py-3 pr-3">
                                  Normalisasi
                                </th>
                                <th className="py-3">
                                  Kontribusi
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {criteria.map((criterion) => (
                                <tr
                                  key={criterion.key}
                                  className="border-b border-slate-200"
                                >
                                  <td className="py-3 pr-3 font-medium">
                                    {criterion.label}
                                  </td>

                                  <td className="py-3 pr-3">
                                    {formatRaw(
                                      criterion.key,
                                      item.raw[criterion.key]
                                    )}
                                  </td>

                                  <td className="py-3 pr-3">
                                    {decimal(
                                      item.normalized[
                                        criterion.key
                                      ]
                                    )}
                                  </td>

                                  <td className="py-3">
                                    {decimal(
                                      item.contributions[
                                        criterion.key
                                      ]
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <p className="mt-4 text-sm font-bold text-blue-700">
                          Total Skor: {decimal(item.score)}
                        </p>

                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          Kontribusi = nilai normalisasi
                          dikalikan bobot. Skor akhir =
                          jumlah seluruh kontribusi.
                        </p>
                      </details>

                      {/* CAR DETAIL LINK */}

                      <Link
                        href={`/mobil/${item.car.id}`}
                        className="mt-5 inline-flex rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                      >
                        Lihat Detail Mobil
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {/* NORMALIZED WEIGHTS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Bobot yang Digunakan
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Bobot berikut telah dinormalisasi oleh
              backend Golang.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-4">
              {criteria.map((criterion) => (
                <div
                  key={criterion.key}
                  className="rounded-xl bg-slate-50 p-4"
                >
                  <p className="text-sm text-slate-500">
                    {criterion.label}
                  </p>

                  <p className="mt-2 text-xl font-bold text-blue-700">
                    {(
                      data.weights[criterion.key] * 100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              Skor SAW menunjukkan perbandingan relatif
              antaralternatif yang memenuhi filter.
              Skor bukan persentase kepastian keputusan
              pembelian.
            </p>
          </div>

          {/* COMPLETE SAW MATRIX */}

          {data.results.length > 0 && (
            <>
              <SAWCalculationDetails data={data} />
              <SAWSensitivityPanel data={data} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
