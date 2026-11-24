
import RecommendationForm from "../../components/recommendation/RecommendationForm";

export default function RekomendasiPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="font-semibold text-blue-400">
            SMART CAR RECOMMENDATION
          </p>

          <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">
            Temukan Mobil Sesuai Kebutuhan
          </h1>

          <p className="mt-5 max-w-3xl leading-8 text-slate-300">
            Sistem Pendukung Keputusan AutoDrive menggunakan
            metode Simple Additive Weighting (SAW) untuk
            membandingkan kendaraan berdasarkan harga,
            tahun produksi, kapasitas kursi, dan transmisi.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <RecommendationForm />
      </section>
    </main>
  );
}
