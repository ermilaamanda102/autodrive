
"use client";

import { useMemo, useState } from "react";

type Criterion =
  | "price"
  | "year"
  | "seats"
  | "transmission";

type Values = Record<Criterion, number>;

type RankedCar = {
  rank: number;
  car: {
    id: number;
    brand: string;
    model: string;
    price: number;
  };
  normalized: Values;
  score: number;
};

type SensitivityData = {
  weights: Values;
  results: RankedCar[];
};

type Scenario = {
  id: string;
  name: string;
  description: string;
  weights: Values;
};

const keys: Criterion[] = [
  "price",
  "year",
  "seats",
  "transmission",
];

const labels: Record<Criterion, string> = {
  price: "Harga",
  year: "Tahun",
  seats: "Kursi",
  transmission: "Transmisi",
};

function scoreWithWeights(
  normalized: Values,
  weights: Values
): number {
  return keys.reduce(
    (total, key) =>
      total + normalized[key] * weights[key],
    0
  );
}

function formatScore(value: number): string {
  return value.toFixed(4).replace(".", ",");
}

export default function SAWSensitivityPanel({
  data,
}: {
  data: SensitivityData;
}) {
  const [scenarioId, setScenarioId] =
    useState("baseline");

  const scenarios = useMemo<Scenario[]>(() => {
    return [
      {
        id: "baseline",
        name: "Bobot Awal",
        description:
          "Menggunakan bobot yang dipakai pada hasil rekomendasi.",
        weights: { ...data.weights },
      },
      {
        id: "price",
        name: "Prioritas Harga",
        description:
          "Harga menjadi pertimbangan utama sebesar 70%.",
        weights: {
          price: 0.7,
          year: 0.1,
          seats: 0.1,
          transmission: 0.1,
        },
      },
      {
        id: "year",
        name: "Prioritas Tahun",
        description:
          "Tahun produksi menjadi prioritas sebesar 70%.",
        weights: {
          price: 0.1,
          year: 0.7,
          seats: 0.1,
          transmission: 0.1,
        },
      },
      {
        id: "seats",
        name: "Prioritas Kursi",
        description:
          "Kapasitas kursi menjadi prioritas sebesar 70%.",
        weights: {
          price: 0.1,
          year: 0.1,
          seats: 0.7,
          transmission: 0.1,
        },
      },
      {
        id: "transmission",
        name: "Prioritas Transmisi",
        description:
          "Kecocokan transmisi menjadi prioritas sebesar 70%.",
        weights: {
          price: 0.1,
          year: 0.1,
          seats: 0.1,
          transmission: 0.7,
        },
      },
    ];
  }, [data.weights]);

  const scenario =
    scenarios.find((item) => item.id === scenarioId) ??
    scenarios[0];

  const ranking = useMemo(() => {
    return data.results
      .map((item) => ({
        car: item.car,
        previousRank: item.rank,
        score: scoreWithWeights(
          item.normalized,
          scenario.weights
        ),
      }))
      .sort((a, b) => {
        if (Math.abs(a.score - b.score) > 1e-12) {
          return b.score - a.score;
        }

        if (a.car.price !== b.car.price) {
          return a.car.price - b.car.price;
        }

        return a.car.id - b.car.id;
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }, [data.results, scenario.weights]);

  if (data.results.length === 0) {
    return null;
  }

  const originalWinner = data.results.find(
    (item) => item.rank === 1
  );

  const newWinner = ranking[0];

  const winnerChanged =
    originalWinner?.car.id !== newWinner?.car.id;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
          Evaluasi Stabilitas Peringkat
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Analisis Sensitivitas Bobot SAW
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Bandingkan peringkat mobil ketika tingkat
          kepentingan setiap kriteria berubah.
          Alternatif dan matriks normalisasi tetap
          menggunakan hasil perhitungan awal.
        </p>
      </div>

      {/* SCENARIO SELECTION */}

      <div className="mt-7">
        <label
          htmlFor="sensitivity-scenario"
          className="block text-sm font-semibold text-slate-800"
        >
          Pilih Skenario Pembobotan
        </label>

        <select
          id="sensitivity-scenario"
          value={scenarioId}
          onChange={(event) =>
            setScenarioId(event.target.value)
          }
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          {scenarios.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <p className="mt-2 text-sm text-slate-600">
          {scenario.description}
        </p>
      </div>

      {/* SCENARIO WEIGHTS */}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {keys.map((key) => (
          <div
            key={key}
            className="rounded-xl bg-slate-50 p-4"
          >
            <p className="text-xs text-slate-500">
              {labels[key]}
            </p>

            <p className="mt-2 text-xl font-bold text-blue-700">
              {(scenario.weights[key] * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>

      {/* WINNER COMPARISON */}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">
            Peringkat Pertama Awal
          </p>

          <p className="mt-2 font-bold text-slate-900">
            {originalWinner?.car.brand}{" "}
            {originalWinner?.car.model}
          </p>

          <p className="mt-2 text-sm text-slate-600">
            Skor:{" "}
            {originalWinner
              ? formatScore(originalWinner.score)
              : "-"}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm text-slate-600">
            Peringkat Pertama Skenario
          </p>

          <p className="mt-2 font-bold text-slate-900">
            {newWinner.car.brand} {newWinner.car.model}
          </p>

          <p className="mt-2 text-sm font-semibold text-blue-700">
            Skor: {formatScore(newWinner.score)}
          </p>
        </div>
      </div>

      {/* RANKING TABLE */}

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-900">
          Perbandingan Peringkat
        </h3>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3">Mobil</th>
                <th className="px-4 py-3 text-center">
                  Rank Awal
                </th>
                <th className="px-4 py-3 text-center">
                  Rank Skenario
                </th>
                <th className="px-4 py-3 text-right">
                  Skor Skenario
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {ranking.map((item) => (
                <tr
                  key={item.car.id}
                  className={
                    item.rank === 1 ? "bg-blue-50" : ""
                  }
                >
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {item.car.brand} {item.car.model}
                  </td>

                  <td className="px-4 py-4 text-center">
                    #{item.previousRank}
                  </td>

                  <td className="px-4 py-4 text-center font-bold text-blue-700">
                    #{item.rank}
                  </td>

                  <td className="px-4 py-4 text-right font-semibold tabular-nums">
                    {formatScore(item.score)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INTERPRETATION */}

      <div className="mt-6 rounded-xl bg-slate-50 p-5">
        <h3 className="font-bold text-slate-900">
          Interpretasi Skenario
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-700">
          {winnerChanged
            ? "Alternatif peringkat pertama berubah ketika bobot kriteria disesuaikan. Hal ini menunjukkan bahwa pilihan terbaik pada skenario tersebut sensitif terhadap perubahan prioritas."
            : "Alternatif peringkat pertama tetap sama pada skenario ini. Namun, perubahan skor atau peringkat alternatif lain masih dapat terjadi."}
        </p>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Analisis ini mengubah bobot pada matriks
          normalisasi yang sama. Jika filter anggaran,
          jumlah kursi, atau data kendaraan berubah,
          jalankan kembali perhitungan rekomendasi utama.
        </p>
      </div>
    </section>
  );
}
