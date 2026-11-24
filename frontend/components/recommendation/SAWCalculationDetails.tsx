
"use client";

import { useState } from "react";

type Criterion = "price" | "year" | "seats" | "transmission";

type Values = Record<Criterion, number>;

type Car = {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  seats: number;
  transmission: string;
};

type RankedCar = {
  rank: number;
  car: Car;
  raw: Values;
  normalized: Values;
  contributions: Values;
  score: number;
};

export type SAWData = {
  weights: Values;
  alternatives: number;
  normalization_basis?: {
    min_price: number;
    max_year: number;
    max_seats: number;
  };
  results: RankedCar[];
};

const criteria: {
  key: Criterion;
  label: string;
  code: string;
  kind: "Cost" | "Benefit";
}[] = [
  { key: "price", label: "Harga", code: "C1", kind: "Cost" },
  { key: "year", label: "Tahun", code: "C2", kind: "Benefit" },
  { key: "seats", label: "Kursi", code: "C3", kind: "Benefit" },
  {
    key: "transmission",
    label: "Transmisi",
    code: "C4",
    kind: "Benefit",
  },
];

function decimal(value: number): string {
  return Number.isFinite(value)
    ? value.toFixed(4).replace(".", ",")
    : "-";
}

function rupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRaw(
  key: Criterion,
  value: number
): string {
  if (key === "price") return rupiah(value);
  if (key === "transmission") return decimal(value);
  return String(value);
}

export default function SAWCalculationDetails({
  data,
}: {
  data: SAWData;
}) {
  const [open, setOpen] = useState(false);

  const results = data.results ?? [];
  const basis = data.normalization_basis;

  if (results.length === 0) {
    return null;
  }

  const weightTotal = criteria.reduce(
    (sum, criterion) => sum + data.weights[criterion.key],
    0
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4 p-6 md:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Transparansi Perhitungan
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Matriks Perhitungan SAW
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Periksa nilai alternatif, normalisasi, kontribusi
            berbobot, dan skor akhir setiap kendaraan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          aria-controls="saw-matrix-content"
          className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          {open ? "Tutup Perhitungan" : "Lihat Matriks SAW"}
        </button>
      </div>

      {open && (
        <div
          id="saw-matrix-content"
          className="space-y-8 border-t border-slate-200 p-6 md:p-8"
        >
          {/* SUMMARY */}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Jumlah Alternatif
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {results.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Jumlah Kriteria
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {criteria.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Total Bobot
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {(weightTotal * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* CRITERIA AND WEIGHTS */}

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              1. Kriteria dan Bobot
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Harga adalah kriteria cost. Tahun, kursi,
              dan kecocokan transmisi adalah benefit.
            </p>

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[550px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">Kriteria</th>
                    <th className="px-4 py-3">Jenis</th>
                    <th className="px-4 py-3 text-right">
                      Bobot
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {criteria.map((criterion) => (
                    <tr key={criterion.key}>
                      <td className="px-4 py-3 font-semibold">
                        {criterion.code}
                      </td>
                      <td className="px-4 py-3">
                        {criterion.label}
                      </td>
                      <td className="px-4 py-3">
                        {criterion.kind}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {(
                          data.weights[criterion.key] * 100
                        ).toFixed(1)}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DECISION MATRIX */}

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              2. Matriks Keputusan (X)
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Nilai asli setiap alternatif setelah
              penyaringan anggaran dan minimum kursi.
              Transmisi menggunakan skor kecocokan.
            </p>

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Alternatif</th>
                    {criteria.map((criterion) => (
                      <th
                        key={criterion.key}
                        className="px-4 py-3 text-right"
                      >
                        {criterion.code}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {results.map((item) => (
                    <tr key={item.car.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {item.car.brand} {item.car.model}
                      </td>

                      {criteria.map((criterion) => (
                        <td
                          key={criterion.key}
                          className="px-4 py-3 text-right tabular-nums text-slate-700"
                        >
                          {formatRaw(
                            criterion.key,
                            item.raw[criterion.key]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* NORMALIZATION BASIS */}

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              3. Dasar Normalisasi
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">
                  Harga Minimum
                </p>
                <p className="mt-2 font-bold text-slate-900">
                  {rupiah(
                    basis?.min_price ??
                      Math.min(...results.map((r) => r.car.price))
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">
                  Tahun Maksimum
                </p>
                <p className="mt-2 font-bold text-slate-900">
                  {basis?.max_year ??
                    Math.max(...results.map((r) => r.car.year))}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">
                  Kursi Maksimum
                </p>
                <p className="mt-2 font-bold text-slate-900">
                  {basis?.max_seats ??
                    Math.max(...results.map((r) => r.car.seats))}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm leading-7 text-slate-700">
              <p>
                <strong>Harga (cost):</strong> harga minimum
                dibagi harga setiap mobil.
              </p>
              <p>
                <strong>Tahun (benefit):</strong> tahun mobil
                dibagi tahun maksimum.
              </p>
              <p>
                <strong>Kursi (benefit):</strong> jumlah kursi
                dibagi kapasitas maksimum.
              </p>
              <p>
                <strong>Transmisi:</strong> skor kecocokan 1
                atau 0,5 sesuai preferensi pembeli.
              </p>
            </div>
          </div>

          {/* NORMALIZED MATRIX */}

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              4. Matriks Normalisasi (R)
            </h3>

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Alternatif</th>
                    {criteria.map((criterion) => (
                      <th
                        key={criterion.key}
                        className="px-4 py-3 text-right"
                      >
                        {criterion.code}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {results.map((item) => (
                    <tr key={item.car.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {item.car.brand} {item.car.model}
                      </td>

                      {criteria.map((criterion) => (
                        <td
                          key={criterion.key}
                          className="px-4 py-3 text-right tabular-nums text-slate-700"
                        >
                          {decimal(
                            item.normalized[criterion.key]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* WEIGHTED CONTRIBUTIONS */}

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              5. Kontribusi Bobot dan Skor Akhir
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Setiap nilai normalisasi dikalikan bobotnya.
              Seluruh kontribusi kemudian dijumlahkan.
            </p>

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Alternatif</th>
                    {criteria.map((criterion) => (
                      <th
                        key={criterion.key}
                        className="px-4 py-3 text-right"
                      >
                        {criterion.code}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {results.map((item) => (
                    <tr
                      key={item.car.id}
                      className={
                        item.rank === 1 ? "bg-blue-50" : ""
                      }
                    >
                      <td className="px-4 py-3 font-bold text-blue-700">
                        #{item.rank}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {item.car.brand} {item.car.model}
                      </td>

                      {criteria.map((criterion) => (
                        <td
                          key={criterion.key}
                          className="px-4 py-3 text-right tabular-nums"
                        >
                          {decimal(
                            item.contributions[criterion.key]
                          )}
                        </td>
                      ))}

                      <td className="px-4 py-3 text-right font-bold tabular-nums text-blue-700">
                        {decimal(item.score)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FINAL INTERPRETATION */}

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="font-bold text-slate-900">
              Kesimpulan Perhitungan
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-700">
              Berdasarkan bobot dan preferensi yang dipilih,
              mobil dengan peringkat pertama adalah{" "}
              <strong>
                {results[0].car.brand} {results[0].car.model}
              </strong>
              {" "}dengan skor SAW{" "}
              <strong>{decimal(results[0].score)}</strong>.
              Hasil ini merupakan peringkat relatif terhadap
              alternatif yang memenuhi persyaratan, bukan
              jaminan kualitas kendaraan secara keseluruhan.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
