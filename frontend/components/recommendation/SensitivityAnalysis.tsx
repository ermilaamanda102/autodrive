
"use client";

import { useState } from "react";

type Weights = {
  price: number;
  year: number;
  seats: number;
  transmission: number;
};

type Preferences = {
  max_budget: number;
  min_seats: number;
  transmission: string;
  weights: Weights;
};

type RankedCar = {
  rank: number;
  score: number;
  car: {
    id: number;
    brand: string;
    model: string;
  };
};

type Scenario = {
  key: string;
  name: string;
  weights: Weights;
  results: RankedCar[];
};

type Winner = {
  car_id: number;
  name: string;
  wins: number;
};

type SensitivityData = {
  alternatives: number;
  scenarios: Scenario[];
  winners: Winner[];
};

type Props = {
  preferences: Preferences;
};

function score(value: number) {
  return value.toFixed(4);
}

export default function SensitivityAnalysis({
  preferences,
}: Props) {
  const [data, setData] =
    useState<SensitivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await fetch(
        "/api/recommendations/sensitivity",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preferences),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Analisis sensitivitas gagal"
        );
      }

      if (!Array.isArray(result.data?.scenarios)) {
        throw new Error(
          "Format hasil sensitivitas tidak valid"
        );
      }

      setData(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan"
      );
    } finally {
      setLoading(false);
    }
  }

  const firstScenario = data?.scenarios[0];

  const carIds = firstScenario
    ? firstScenario.results.map((item) => item.car.id)
    : [];

  const carNames = new Map<number, string>();

  if (firstScenario) {
    for (const item of firstScenario.results) {
      carNames.set(
        item.car.id,
        `${item.car.brand} ${item.car.model}`
      );
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-2xl font-bold text-slate-900">
        Analisis Sensitivitas SAW
      </h2>

      <p className="mt-3 text-sm leading-7 text-slate-600">
        Bandingkan hasil rekomendasi menggunakan empat
        skenario bobot. Batas anggaran, minimum kursi,
        dan preferensi transmisi tetap sama.
      </p>

      <button
        type="button"
        onClick={runAnalysis}
        disabled={loading}
        className="mt-5 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading
          ? "Menganalisis..."
          : "Jalankan Analisis Sensitivitas"}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {data && (
        <div className="mt-8 space-y-8">
          <p className="text-sm text-slate-600">
            Jumlah alternatif yang dibandingkan:{" "}
            <strong>{data.alternatives}</strong>
          </p>

          {data.alternatives === 0 ? (
            <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-600">
              Tidak ada mobil yang memenuhi filter.
              Ubah anggaran atau jumlah kursi minimum.
            </p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {data.scenarios.map((scenario) => {
                  const winner = scenario.results[0];

                  return (
                    <div
                      key={scenario.key}
                      className="rounded-xl border border-slate-200 p-5"
                    >
                      <h3 className="font-bold text-slate-900">
                        {scenario.name}
                      </h3>

                      <p className="mt-2 text-xs text-slate-500">
                        Harga {scenario.weights.price * 100}%,
                        Tahun {scenario.weights.year * 100}%,
                        Kursi {scenario.weights.seats * 100}%,
                        Transmisi{" "}
                        {scenario.weights.transmission * 100}%
                      </p>

                      {winner && (
                        <div className="mt-4">
                          <p className="text-sm text-slate-500">
                            Peringkat pertama
                          </p>

                          <p className="mt-1 font-semibold text-blue-700">
                            {winner.car.brand}{" "}
                            {winner.car.model}
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            Skor: {score(winner.score)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Matriks Perubahan Peringkat
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Angka menunjukkan peringkat setiap mobil
                  pada masing-masing skenario.
                </p>

                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3">
                          Mobil
                        </th>

                        {data.scenarios.map((scenario) => (
                          <th
                            key={scenario.key}
                            className="px-4 py-3"
                          >
                            {scenario.name}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {carIds.map((id) => (
                        <tr key={id}>
                          <td className="px-4 py-3 font-semibold">
                            {carNames.get(id)}
                          </td>

                          {data.scenarios.map((scenario) => {
                            const result =
                              scenario.results.find(
                                (item) => item.car.id === id
                              );

                            return (
                              <td
                                key={scenario.key}
                                className="px-4 py-3 tabular-nums"
                              >
                                {result
                                  ? `#${result.rank} (${score(result.score)})`
                                  : "-"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Frekuensi Peringkat Pertama
                </h3>

                <div className="mt-4 space-y-3">
                  {data.winners.map((winner) => (
                    <div
                      key={winner.car_id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-slate-900">
                          {winner.name}
                        </span>

                        <span className="text-sm text-blue-700">
                          {winner.wins} dari{" "}
                          {data.scenarios.length} skenario
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${
                              (winner.wins /
                                data.scenarios.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs leading-6 text-slate-500">
                  Frekuensi kemenangan hanya menggambarkan
                  empat skenario yang diuji. Nilai ini
                  bukan probabilitas keberhasilan pembelian.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
