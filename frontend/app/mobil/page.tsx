
import CarCatalog from "./CarCatalog";

export const instant = false;

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

async function getCars(): Promise<Car[]> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("API_URL belum dikonfigurasi");
  }

  const response = await fetch(`${apiUrl}/api/cars`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data mobil");
  }

  const result: {
    status: string;
    message: string;
    total: number;
    data: Car[];
  } = await response.json();

  return result.data;
}

export default async function MobilPage() {
  const cars = await getCars();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">

        {/* HEADER KATALOG */}
        <div>
          <p className="font-semibold text-blue-700">
            AUTODRIVE SHOWROOM
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Katalog Mobil
          </h1>

          <p className="mt-2 text-slate-600">
            Temukan mobil terbaik sesuai kebutuhan dan anggaran Anda.
          </p>
        </div>

        {/* KOMPONEN KATALOG */}
        <CarCatalog cars={cars} />

      </div>
    </main>
  );
}
