
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CarFront,
  CheckCircle2,
  ClipboardCheck,
  Headset,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

import { getCurrentUser } from "../../../../lib/auth";
import InquiryForm from "../../../../components/inquiries/InquiryForm";

export const instant = false;
type Props = {
  params: Promise<{ id: string }>;
};

type Car = {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  transmission: string;
  fuel_type: string;
  seats: number;
  status: string;
  image_url: string;
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function validImageUrl(value: string) {
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

export default async function ApplyInquiryPage({
  params,
}: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "buyer") {
    redirect("/dashboard");
  }

  const { id } = await params;

  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    notFound();
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("API_URL belum dikonfigurasi.");
  }

  const response = await fetch(
    `${apiUrl.replace(/\/$/, "")}/api/cars/${id}`,
    { cache: "no-store" }
  );

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Gagal memuat kendaraan.");
  }

  const result = await response.json();
  const car = result.data as Car | undefined;

  if (!car || car.status !== "available") {
    notFound();
  }

  const carName = `${car.brand} ${car.model}`;

  return (
    <main className="min-h-screen bg-[#F3F6FB] px-4 py-10 text-slate-900 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-6xl">
        {/* BACK LINK */}

        <Link
          href={`/mobil/${car.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          <ArrowLeft size={17} />
          Kembali ke Detail Mobil
        </Link>

        {/* PAGE HEADING */}

        <div className="mt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold tracking-wide text-blue-700">
            <Headset size={15} />
            LAYANAN KONSULTASI AUTODRIVE
          </div>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Ajukan Minat Kendaraan
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Sudah menemukan mobil yang cocok?
            Kirim pengajuan dan tim Sales AutoDrive
            dapat menindaklanjuti kebutuhanmu.
          </p>
        </div>

        {/* MAIN GRID */}

        <div className="mt-9 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* CAR SUMMARY */}

          <div className="space-y-5">
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative flex h-60 items-center justify-center bg-slate-100 sm:h-72">
                {validImageUrl(car.image_url ?? "") ? (
                  <Image
                    src={car.image_url}
                    alt={`Foto ${carName}`}
                    fill
                    unoptimized
                    priority
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <CarFront size={44} />
                    <p className="text-sm">
                      Foto belum tersedia
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Kendaraan Pilihan
                  </p>

                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                    <CheckCircle2 size={14} />
                    Tersedia
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-slate-900">
                  {carName}
                </h2>

                <p className="mt-3 text-2xl font-extrabold text-blue-700">
                  {rupiah(car.price)}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 text-sm">
                  <div>
                    <p className="text-slate-500">Tahun</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {car.year}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">
                      Transmisi
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {car.transmission}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">
                      Kapasitas
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {car.seats} penumpang
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">
                      Bahan Bakar
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {car.fuel_type}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/mobil/${car.id}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
                >
                  Lihat Detail Kendaraan
                  <ArrowLeft
                    size={15}
                    className="rotate-180"
                  />
                </Link>
              </div>
            </article>

            {/* TRUST INFORMATION */}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={23}
                  className="shrink-0 text-blue-700"
                />

                <div>
                  <h3 className="font-bold text-slate-900">
                    Pengajuan Melalui Akun Pembeli
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Pengajuan dicatat menggunakan akun
                    AutoDrive yang sedang login.
                    Perkembangannya dapat dipantau
                    melalui Dashboard Pembeli.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* INQUIRY FORM */}

          <div className="space-y-5">
            <InquiryForm
              carId={car.id}
              carName={carName}
            />

            {/* PROCESS INFORMATION */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">
                Bagaimana Proses Selanjutnya?
              </h3>

              <div className="mt-5 space-y-5">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <ClipboardCheck size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      1. Pengajuan Tercatat
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Data pengajuan disimpan dalam sistem
                      AutoDrive.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <MessageCircle size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      2. Tindak Lanjut Sales
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Tim Sales dapat memeriksa dan
                      memperbarui status pengajuan.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <BadgeCheck size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      3. Pantau Perkembangan
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Lihat status terbaru melalui
                      menu Pengajuan Saya.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <LockKeyhole size={14} />
              Pengajuan hanya dapat dibuat oleh akun Pembeli.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
