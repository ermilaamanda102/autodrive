
import Link from "next/link";
import {
  ArrowRight,
  CarFront,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Database,
  Flag,
  Headset,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import type { Metadata } from "next";

// ==========================================
// PAGE METADATA
// ==========================================

export const metadata: Metadata = {
  title: "Tentang Kami | AutoDrive",
  description:
    "Kenali AutoDrive, platform showroom kendaraan dengan sistem rekomendasi mobil menggunakan metode Simple Additive Weighting (SAW).",
};

// ==========================================
// FEATURES
// ==========================================

const features = [
  {
    icon: CarFront,
    title: "Katalog Kendaraan Digital",
    description:
      "Jelajahi pilihan kendaraan dengan informasi harga, tahun produksi, transmisi, kapasitas penumpang, dan spesifikasi mobil.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Rekomendasi Berbasis SAW",
    description:
      "Dapatkan peringkat kendaraan berdasarkan kebutuhan dan bobot kriteria yang dapat disesuaikan oleh pembeli.",
  },
  {
    icon: Headset,
    title: "Layanan Pengajuan Minat",
    description:
      "Hubungi tim Sales melalui pengajuan minat kendaraan dan pantau perkembangan tindak lanjut melalui dashboard.",
  },
  {
    icon: Layers3,
    title: "Transparansi Perhitungan",
    description:
      "Pelajari matriks keputusan, normalisasi, kontribusi bobot, dan skor akhir yang digunakan dalam rekomendasi.",
  },
  {
    icon: ShieldCheck,
    title: "Pengelolaan Hak Akses",
    description:
      "Sistem membedakan hak akses Administrator, Sales, dan Pembeli sesuai fungsi masing-masing.",
  },
  {
    icon: Database,
    title: "Informasi Terintegrasi",
    description:
      "Data kendaraan dan pengajuan dikelola dalam sistem terpusat untuk mendukung konsistensi informasi.",
  },
];

// ==========================================
// MISSIONS
// ==========================================

const missions = [
  "Menyediakan informasi kendaraan yang jelas dan mudah diakses.",
  "Mendukung pemilihan mobil berdasarkan kebutuhan dan anggaran pembeli.",
  "Menerapkan metode SAW untuk menghasilkan rekomendasi yang transparan.",
  "Mempermudah komunikasi antara pembeli dan tim Sales.",
  "Mengembangkan layanan showroom digital yang terintegrasi.",
];

// ==========================================
// SAW CRITERIA
// ==========================================

const criteria = [
  {
    code: "C1",
    name: "Harga Kendaraan",
    weight: 40,
    type: "Cost",
  },
  {
    code: "C2",
    name: "Tahun Produksi",
    weight: 25,
    type: "Benefit",
  },
  {
    code: "C3",
    name: "Kapasitas Kursi",
    weight: 20,
    type: "Benefit",
  },
  {
    code: "C4",
    name: "Kecocokan Transmisi",
    weight: 15,
    type: "Benefit",
  },
];

// ==========================================
// WORKFLOW
// ==========================================

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Jelajahi Kendaraan",
    description:
      "Temukan pilihan mobil melalui katalog AutoDrive.",
  },
  {
    number: "02",
    icon: Compass,
    title: "Tentukan Preferensi",
    description:
      "Atur anggaran, kapasitas kursi, transmisi, dan bobot kriteria.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Dapatkan Rekomendasi",
    description:
      "Sistem SAW menghitung skor dan menyusun peringkat kendaraan.",
  },
  {
    number: "04",
    icon: ClipboardCheck,
    title: "Ajukan Minat",
    description:
      "Kirim pengajuan kendaraan pilihan kepada tim Sales.",
  },
];

// ==========================================
// PAGE
// ==========================================

export default function TentangKamiPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* ==================================
          HERO SECTION
      ================================== */}

      <section className="relative overflow-hidden bg-slate-950">
        {/* Decorative Background */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          {/* HERO CONTENT */}

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-300">
              <CarFront size={16} />
              Tentang AutoDrive
            </div>

            <h1 className="mt-7 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Temukan Mobil yang Tepat.

              <span className="mt-2 block text-blue-400">
                Buat Keputusan Lebih Cerdas.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
              AutoDrive merupakan platform showroom
              kendaraan berbasis web yang mengintegrasikan
              katalog digital, sistem rekomendasi mobil,
              dan layanan pengajuan minat dalam satu
              aplikasi.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/mobil"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                Jelajahi Katalog
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/rekomendasi"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Sparkles size={18} />
                Coba Rekomendasi
              </Link>
            </div>
          </div>

          {/* HERO VISUAL */}

          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <CarFront size={34} />
                </div>

                <div>
                  <p className="text-2xl font-extrabold text-white">
                    AutoDrive.
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Smart Automotive Platform
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <ChartNoAxesCombined
                    size={26}
                    className="text-blue-400"
                  />

                  <p className="mt-4 text-3xl font-bold text-white">
                    SAW
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Metode Rekomendasi
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <Target
                    size={26}
                    className="text-blue-400"
                  />

                  <p className="mt-4 text-3xl font-bold text-white">
                    4
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Kriteria Penilaian
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <Users
                    size={26}
                    className="text-blue-400"
                  />

                  <p className="mt-4 text-3xl font-bold text-white">
                    3
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Role Pengguna
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <Layers3
                    size={26}
                    className="text-blue-400"
                  />

                  <p className="mt-4 text-3xl font-bold text-white">
                    1
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Platform Terintegrasi
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-xl bg-blue-500/10 p-4">
                <CheckCircle2
                  size={22}
                  className="shrink-0 text-blue-400"
                />

                <p className="text-sm leading-6 text-blue-100">
                  Mendukung keputusan pembelian
                  berdasarkan preferensi pengguna.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================
          ABOUT SECTION
      ================================== */}

      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          {/* ABOUT VISUAL */}

          <div className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-blue-800 to-blue-600 p-10">
            <div
              aria-hidden="true"
              className="absolute h-64 w-64 rounded-full border border-white/20"
            />

            <div
              aria-hidden="true"
              className="absolute h-80 w-80 rounded-full border border-white/10"
            />

            <div className="relative text-center">
              <CarFront
                size={110}
                strokeWidth={1.2}
                className="mx-auto text-white"
              />

              <p className="mt-6 text-4xl font-extrabold text-white">
                AutoDrive.
              </p>

              <p className="mt-3 text-sm text-blue-100">
                Technology for Better Decisions
              </p>
            </div>
          </div>

          {/* ABOUT CONTENT */}

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Siapa Kami
            </p>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Showroom Digital dengan Pendekatan
              Berbasis Data
            </h2>

            <p className="mt-6 text-base leading-8 text-slate-600">
              AutoDrive dikembangkan untuk membantu
              calon pembeli menemukan kendaraan yang
              sesuai dengan kebutuhan, anggaran, dan
              preferensi masing-masing.
            </p>

            <p className="mt-4 text-base leading-8 text-slate-600">
              Proses pemilihan mobil sering melibatkan
              berbagai pertimbangan, seperti harga,
              tahun produksi, kapasitas penumpang,
              dan jenis transmisi.
            </p>

            <p className="mt-4 text-base leading-8 text-slate-600">
              Melalui Sistem Pendukung Keputusan
              menggunakan metode Simple Additive
              Weighting (SAW), AutoDrive membantu
              membandingkan alternatif kendaraan
              secara sistematis berdasarkan kriteria
              yang ditentukan pengguna.
            </p>

            <Link
              href="/rekomendasi"
              className="mt-7 inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-800"
            >
              Pelajari Sistem Rekomendasi
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================
          VISION AND MISSION
      ================================== */}

      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Arah Pengembangan
            </p>

            <h2 className="mt-4 text-3xl font-extrabold text-slate-950 sm:text-4xl">
              Visi dan Misi
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Mengembangkan pengalaman pemilihan
              kendaraan yang mudah, informatif,
              dan transparan.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {/* VISION */}

            <article className="rounded-3xl bg-blue-700 p-8 text-white shadow-sm sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <Target size={29} />
              </div>

              <h3 className="mt-7 text-2xl font-bold">
                Visi Kami
              </h3>

              <p className="mt-5 text-lg leading-9 text-blue-50">
                Mewujudkan platform showroom digital
                yang mendukung proses pemilihan
                kendaraan secara mudah, transparan,
                dan berbasis data melalui pemanfaatan
                teknologi sistem pendukung keputusan.
              </p>
            </article>

            {/* MISSION */}

            <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Flag size={28} />
              </div>

              <h3 className="mt-7 text-2xl font-bold">
                Misi Kami
              </h3>

              <ul className="mt-6 space-y-5">
                {missions.map((mission) => (
                  <li
                    key={mission}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2
                      size={20}
                      className="mt-0.5 shrink-0 text-blue-700"
                    />

                    <span className="text-sm leading-7 text-slate-600">
                      {mission}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ==================================
          FEATURES SECTION
      ================================== */}

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Fitur AutoDrive
            </p>

            <h2 className="mt-4 text-3xl font-extrabold text-slate-950 sm:text-4xl">
              Apa yang Ditawarkan AutoDrive?
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Berbagai fitur yang mendukung proses
              pencarian, pemilihan, dan pengajuan
              kendaraan.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                    <Icon size={27} />
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================
          SAW METHOD SECTION
      ================================== */}

      <section className="bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Teknologi Rekomendasi
            </p>

            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Simple Additive Weighting (SAW)
            </h2>

            <p className="mt-6 leading-8 text-slate-300">
              SAW merupakan metode pengambilan
              keputusan multikriteria yang menghitung
              nilai setiap alternatif melalui
              normalisasi dan penjumlahan terbobot.
            </p>

            <p className="mt-4 leading-8 text-slate-300">
              AutoDrive menggunakan metode ini untuk
              membantu menyusun peringkat kendaraan
              berdasarkan empat kriteria utama.
              Bobot setiap kriteria dapat disesuaikan
              dengan prioritas pembeli.
            </p>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                Prinsip Perhitungan
              </p>

              <p className="mt-4 text-lg font-semibold text-white">
                Skor Akhir = Σ (Bobot × Normalisasi)
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Skor yang lebih tinggi menunjukkan
                kesesuaian relatif yang lebih baik
                berdasarkan kriteria dan bobot
                yang digunakan.
              </p>
            </div>

            <Link
              href="/rekomendasi"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500"
            >
              Gunakan Rekomendasi SAW
              <ArrowRight size={17} />
            </Link>
          </div>

          {/* CRITERIA WEIGHTS */}

          <div className="rounded-3xl border border-white/10 bg-white/5 p-7 sm:p-9">
            <h3 className="text-xl font-bold">
              Kriteria Penilaian
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Konfigurasi bobot awal AutoDrive.
            </p>

            <div className="mt-8 space-y-7">
              {criteria.map((criterion) => (
                <div key={criterion.code}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-blue-500/15 px-2.5 py-1.5 text-xs font-bold text-blue-300">
                        {criterion.code}
                      </span>

                      <p className="text-sm font-semibold text-white">
                        {criterion.name}
                      </p>
                    </div>

                    <p className="font-bold text-blue-300">
                      {criterion.weight}%
                    </p>
                  </div>

                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${criterion.weight}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Kriteria {criterion.type}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-white/10 pt-5">
              <div className="flex justify-between">
                <p className="text-sm text-slate-400">
                  Total Bobot Awal
                </p>

                <p className="font-bold text-white">
                  100%
                </p>
              </div>

              <p className="mt-3 text-xs leading-6 text-slate-400">
                Bobot dapat diubah pada halaman
                rekomendasi sesuai kebutuhan pengguna.
                Rekomendasi bukan jaminan kualitas
                kendaraan secara keseluruhan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================
          HOW IT WORKS
      ================================== */}

      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Cara Menggunakan
            </p>

            <h2 className="mt-4 text-3xl font-extrabold text-slate-950 sm:text-4xl">
              Empat Langkah Menemukan Mobil
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Mulai dari pencarian kendaraan hingga
              pengajuan minat kepada tim Sales.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.number}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Icon size={23} />
                    </div>

                    <span className="text-3xl font-extrabold text-slate-200">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================
          CALL TO ACTION
      ================================== */}

      <section className="bg-white px-6 py-16">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full border border-white/10"
          />

          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
              <CarFront size={34} />
            </div>

            <h2 className="mx-auto mt-7 max-w-3xl text-3xl font-extrabold sm:text-4xl">
              Siap Menemukan Mobil yang Sesuai
              dengan Kebutuhanmu?
            </h2>

            <p className="mx-auto mt-5 max-w-xl leading-7 text-blue-100">
              Jelajahi katalog AutoDrive dan manfaatkan
              sistem rekomendasi untuk membantu
              menentukan kendaraan pilihanmu.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/mobil"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
              >
                Lihat Katalog Mobil
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/rekomendasi"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <Sparkles size={18} />
                Mulai Rekomendasi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
