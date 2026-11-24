
type Criterion = "price" | "year" | "seats" | "transmission";

type Values = Record<Criterion, number>;

type MatrixItem = {
  rank: number;
  car: {
    id: number;
    brand: string;
    model: string;
  };
  raw: Values;
  normalized: Values;
  contributions: Values;
  score: number;
};

type Props = {
  results: MatrixItem[];
};

const criteria: {
  key: Criterion;
  label: string;
}[] = [
  { key: "price", label: "Harga" },
  { key: "year", label: "Tahun" },
  { key: "seats", label: "Kursi" },
  { key: "transmission", label: "Transmisi" },
];

function formatNumber(value: number) {
  return value.toFixed(4);
}

function formatRaw(key: Criterion, value: number) {
  if (key === "price") {
    return new Intl.NumberFormat("id-ID").format(value);
  }

  if (key === "transmission") {
    return value.toFixed(2);
  }

  return String(value);
}

export default function SAWMatrix({ results }: Props) {
  if (results.length === 0) return null;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Matriks Perhitungan SAW
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Tabel berikut menampilkan nilai awal,
          hasil normalisasi, dan kontribusi berbobot.
        </p>
      </div>

      {[
        {
          title: "1. Matriks Keputusan (X)",
          field: "raw" as const,
        },
        {
          title: "2. Matriks Normalisasi (R)",
          field: "normalized" as const,
        },
        {
          title: "3. Matriks Kontribusi Berbobot",
          field: "contributions" as const,
        },
      ].map((matrix) => (
        <div
          key={matrix.field}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="border-b border-slate-200 p-5">
            <h3 className="font-bold text-slate-900">
              {matrix.title}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Mobil</th>
                  {criteria.map((criterion) => (
                    <th
                      key={criterion.key}
                      className="px-4 py-3"
                    >
                      {criterion.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {results.map((item) => (
                  <tr key={item.car.id}>
                    <td className="px-4 py-3 font-semibold">
                      {item.car.brand} {item.car.model}
                    </td>

                    {criteria.map((criterion) => {
                      const value =
                        item[matrix.field][criterion.key];

                      return (
                        <td
                          key={criterion.key}
                          className="px-4 py-3 tabular-nums"
                        >
                          {matrix.field === "raw"
                            ? formatRaw(criterion.key, value)
                            : formatNumber(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-slate-900">
          Peringkat Akhir
        </h3>

        <div className="mt-4 space-y-3">
          {results.map((item) => (
            <div
              key={item.car.id}
              className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3"
            >
              <span className="text-sm text-slate-700">
                #{item.rank} {item.car.brand} {item.car.model}
              </span>

              <span className="font-bold tabular-nums text-blue-700">
                {formatNumber(item.score)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
