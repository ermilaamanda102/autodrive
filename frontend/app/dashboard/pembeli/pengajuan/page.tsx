
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CarFront,
  ClipboardList,
  Clock3,
  MessageSquareText,
} from "lucide-react";

import { getCurrentUser } from "../../../../lib/auth";
import { inquiryApi } from "../../../../lib/inquiry-api";

// ==========================================
// TYPES
// ==========================================

type InquiryStatus =
  | "pending"
  | "contacted"
  | "negotiating"
  | "completed"
  | "cancelled";

type Inquiry = {
  id: number;
  car_id: number;
  car_name: string;
  car_price: number;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
};

type ApiResponse = {
  status?: string;
  message?: string;
  data?: unknown;
};

// ==========================================
// STATUS CONFIGURATION
// ==========================================

const statusConfig: Record<
  InquiryStatus,
  {
    label: string;
    className: string;
  }
> = {
  pending: {
    label: "Menunggu Sales",
    className: "bg-amber-100 text-amber-800",
  },
  contacted: {
    label: "Sudah Dihubungi",
    className: "bg-blue-100 text-blue-800",
  },
  negotiating: {
    label: "Dalam Negosiasi",
    className: "bg-violet-100 text-violet-800",
  },
  completed: {
    label: "Selesai",
    className: "bg-green-100 text-green-800",
  },
  cancelled: {
    label: "Dibatalkan",
    className: "bg-slate-100 text-slate-700",
  },
};

// ==========================================
// HELPERS
// ==========================================

function rupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isInquiry(value: unknown): value is Inquiry {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "number" &&
    typeof item.car_id === "number" &&
    typeof item.car_name === "string" &&
    typeof item.car_price === "number" &&
    typeof item.message === "string" &&
    typeof item.status === "string" &&
    item.status in statusConfig &&
    typeof item.created_at === "string" &&
    typeof item.updated_at === "string"
  );
}

// ==========================================
// LOAD BUYER INQUIRIES
// ==========================================

async function getBuyerInquiries(): Promise<{
  inquiries: Inquiry[];
  error: string | null;
}> {
  try {
    const response = await inquiryApi(
      "/api/inquiries/my",
      "GET"
    );

    const result: ApiResponse = await response.json();

    if (!response.ok) {
      return {
        inquiries: [],
        error:
          typeof result.message === "string"
            ? result.message
            : "Gagal mengambil riwayat pengajuan.",
      };
    }

    if (!Array.isArray(result.data)) {
      return {
        inquiries: [],
        error: "Format data pengajuan tidak valid.",
      };
    }

    if (!result.data.every(isInquiry)) {
      return {
        inquiries: [],
        error:
          "Data pengajuan dari backend tidak sesuai format.",
      };
    }

    return {
      inquiries: result.data,
      error: null,
    };
  } catch {
    return {
      inquiries: [],
      error:
        "Tidak dapat terhubung ke layanan pengajuan.",
    };
  }
}

// ==========================================
// PAGE
// ==========================================

export default async function BuyerInquiriesPage() {
  // ----------------------------------------
  // AUTHENTICATION
  // ----------------------------------------

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // ----------------------------------------
  // AUTHORIZATION
  // ----------------------------------------

  if (user.role !== "buyer") {
    redirect("/dashboard");
  }

  // ----------------------------------------
  // FETCH DATA
  // ----------------------------------------

  const { inquiries, error } =
    await getBuyerInquiries();

  const pendingCount = inquiries.filter(
    (item) => item.status === "pending"
  ).length;

  const activeCount = inquiries.filter(
    (item) =>
      item.status === "contacted" ||
      item.status === "negotiating"
  ).length;

  const completedCount = inquiries.filter(
    (item) => item.status === "completed"
  ).length;

  // ----------------------------------------
  // RENDER
  // ----------------------------------------

  return (
    <div className="space-y-7 text-slate-900">
      {/* HEADER */}

      <div>
        <Link
          href="/dashboard/pembeli"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          <ArrowLeft size={16} />
          Kembali ke Dashboard
        </Link>

        <p className="mt-6 text-xs font-bold uppercase tracking-wider text-blue-700">
          Aktivitas Pembeli
        </p>

        <h1 className="mt-2 text-2xl font-bold md:text-3xl">
          Riwayat Pengajuan Minat
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Pantau perkembangan pengajuan kendaraan
          yang telah kamu kirim kepada tim Sales AutoDrive.
        </p>
      </div>

      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ClipboardList
            size={23}
            className="text-amber-600"
          />

          <p className="mt-4 text-sm text-slate-500">
            Menunggu Sales
          </p>

          <p className="mt-2 text-3xl font-bold">
            {error ? "—" : pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Clock3
            size={23}
            className="text-blue-700"
          />

          <p className="mt-4 text-sm text-slate-500">
            Dalam Tindak Lanjut
          </p>

          <p className="mt-2 text-3xl font-bold">
            {error ? "—" : activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CarFront
            size={23}
            className="text-green-700"
          />

          <p className="mt-4 text-sm text-slate-500">
            Pengajuan Selesai
          </p>

          <p className="mt-2 text-3xl font-bold">
            {error ? "—" : completedCount}
          </p>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* EMPTY STATE */}

      {!error && inquiries.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ClipboardList
            size={36}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-4 text-lg font-bold">
            Belum Ada Pengajuan Minat
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            Kamu belum mengirim pengajuan kendaraan.
            Jelajahi katalog dan pilih mobil yang
            sesuai dengan kebutuhanmu.
          </p>

          <Link
            href="/mobil"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <CarFront size={17} />
            Jelajahi Katalog Mobil
          </Link>
        </div>
      )}

      {/* INQUIRY LIST */}

      {!error && inquiries.length > 0 && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              Daftar Pengajuan
            </h2>

            <span className="text-sm text-slate-500">
              Total {inquiries.length} pengajuan
            </span>
          </div>

          {inquiries.map((item) => {
            const status = statusConfig[item.status];

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                {/* HEADER */}

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      Nomor Pengajuan #{item.id}
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      {item.car_name}
                    </h3>

                    <p className="mt-3 text-lg font-bold text-blue-700">
                      {rupiah(item.car_price)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-2 text-xs font-bold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                {/* MESSAGE */}

                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <MessageSquareText
                      size={17}
                      className="text-blue-700"
                    />

                    <h4 className="text-sm font-bold">
                      Pesan Pengajuan
                    </h4>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {item.message}
                  </p>
                </div>

                {/* DATE INFORMATION */}

                <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-slate-500">
                      Tanggal Pengajuan
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatDate(item.created_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">
                      Pembaruan Terakhir
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatDate(item.updated_at)}
                    </p>
                  </div>
                </div>

                {/* ACTION */}

                <div className="mt-6">
                  <Link
                    href={`/mobil/${item.car_id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <CarFront size={17} />
                    Lihat Detail Kendaraan
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
