
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Send,
  UserRound,
} from "lucide-react";

type InquiryFormProps = {
  carId: number;
  carName: string;
};

export default function InquiryForm({
  carId,
  carName,
}: InquiryFormProps) {
  const [message, setMessage] = useState(
    `Saya tertarik dengan ${carName}. Mohon informasi lebih lanjut mengenai kondisi dan proses pembelian kendaraan.`
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    const trimmed = message.trim();
    const length = Array.from(trimmed).length;

    if (length < 5 || length > 2000) {
      setError(
        "Pesan harus berisi 5 sampai 2000 karakter."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          car_id: carId,
          message: trimmed,
        }),
      });

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ??
            "Pengajuan gagal dikirim. Silakan coba lagi."
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengirim pengajuan."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
          <CheckCircle2 size={34} />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-slate-900">
          Pengajuan Berhasil Dikirim!
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          Pengajuan minat untuk{" "}
          <strong className="text-slate-900">
            {carName}
          </strong>{" "}
          berhasil dicatat. Tim Sales dapat
          menindaklanjutinya melalui sistem AutoDrive.
        </p>

        <Link
          href="/dashboard/pembeli/pengajuan"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
        >
          Lihat Pengajuan Saya
          <ArrowRight size={17} />
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* FORM HEADER */}

      <div className="border-b border-slate-100 p-6 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <MessageSquareText size={23} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Formulir Konsultasi
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Hubungi Tim Sales
            </h2>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Sampaikan pertanyaan atau kebutuhanmu
          mengenai kendaraan pilihan.
        </p>
      </div>

      {/* FORM BODY */}

      <div className="space-y-6 p-6 sm:p-7">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UserRound size={17} className="text-blue-700" />
            Pengajuan melalui akun Pembeli
          </div>

          <p className="mt-2 text-xs leading-6 text-slate-600">
            Identitas pengirim akan diambil dari akun
            AutoDrive yang sedang login.
          </p>
        </div>

        <div>
          <label
            htmlFor="inquiry-message"
            className="block text-sm font-bold text-slate-800"
          >
            Pesan untuk Tim Sales
          </label>

          <p className="mt-1 text-xs text-slate-500">
            Jelaskan pertanyaan mengenai kondisi,
            harga, atau proses pembelian kendaraan.
          </p>

          <textarea
            id="inquiry-message"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              if (error) setError("");
            }}
            rows={7}
            maxLength={2000}
            required
            disabled={loading}
            placeholder="Tuliskan pesan untuk tim Sales..."
            className="mt-3 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
          />

          <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500">
            <span>Minimal 5 karakter</span>
            <span>
              {Array.from(message).length}/2000
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-blue-700 px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={19} className="animate-spin" />
              Mengirim Pengajuan...
            </>
          ) : (
            <>
              <Send size={19} />
              Kirim Pengajuan Minat
              <ArrowRight size={17} />
            </>
          )}
        </button>

        <p className="text-center text-xs leading-5 text-slate-500">
          Pengajuan akan tersimpan dan dapat dipantau
          melalui menu Pengajuan Saya.
        </p>
      </div>
    </form>
  );
}
