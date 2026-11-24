
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  History,
  Loader2,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";

type InquiryStatus =
  | "pending"
  | "contacted"
  | "negotiating"
  | "completed"
  | "cancelled";

type Inquiry = {
  id: number;
  buyer_id: number;
  buyer_name: string;
  buyer_email: string;
  car_id: number;
  car_name: string;
  car_price: number;
  sales_id: number | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
};

type InquiryHistory = {
  id: number;
  inquiry_id?: number;
  old_status: string;
  new_status: string;
  changed_by: number;
  changed_at?: string;
  created_at?: string;
};

type Draft = {
  status: InquiryStatus;
  salesNote: string;
  originalNote: string;
  noteLoaded: boolean;
};

type ApiResult<T> = {
  status?: string;
  message?: string;
  data?: T;
};

const statuses: {
  value: InquiryStatus;
  label: string;
}[] = [
  { value: "pending", label: "Menunggu Sales" },
  { value: "contacted", label: "Sudah Dihubungi" },
  { value: "negotiating", label: "Negosiasi" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

const statusClasses: Record<InquiryStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  contacted: "bg-blue-100 text-blue-800",
  negotiating: "bg-violet-100 text-violet-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-slate-100 text-slate-700",
};

function statusLabel(status: string): string {
  return (
    statuses.find((item) => item.value === status)
      ?.label ?? status
  );
}

function rupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function requestJSON<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message ||
        `Permintaan gagal: ${url} (HTTP ${response.status})`
    );
  }

  if (!result || result.data === undefined) {
    throw new Error(
      `Respons API tidak memiliki data: ${url}`
    );
  }

  return result.data as T;
}

export default function SalesInquiryManager() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [drafts, setDrafts] = useState<
    Record<number, Draft>
  >({});

  const [history, setHistory] = useState<
    Record<number, InquiryHistory[]>
  >({});

  const [expandedId, setExpandedId] = useState<
    number | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<
    number | null
  >(null);

  const [loadingDetailId, setLoadingDetailId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadInquiries = useCallback(async (
    preserveDrafts = false
  ) => {
    setLoading(true);
    setError("");

    try {
      const data = await requestJSON<Inquiry[]>(
        "/api/sales/inquiries"
      );

      if (!Array.isArray(data)) {
        throw new Error(
          "Daftar pengajuan tidak valid."
        );
      }

      setItems(data);

      setDrafts((previous) => {
        const next: Record<number, Draft> = {};

        for (const item of data) {
          const existing = previous[item.id];

          if (preserveDrafts && existing) {
            next[item.id] = existing;
          } else {
            next[item.id] = {
              status: item.status,
              salesNote: "",
              originalNote: "",
              noteLoaded: false,
            };
          }
        }

        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil daftar pengajuan."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInquiries();
  }, [loadInquiries]);

  function updateDraft(
    id: number,
    patch: Partial<Draft>
  ) {
    setDrafts((previous) => {
      const existing = previous[id];

      if (!existing) return previous;

      return {
        ...previous,
        [id]: {
          ...existing,
          ...patch,
        },
      };
    });
  }

  async function loadDetail(id: number) {
    setLoadingDetailId(id);
    setError("");

    try {
      const [detail, historyData] =
        await Promise.all([
          requestJSON<{
            id: number;
            sales_note: string;
          }>(
            `/api/sales/inquiries/${id}/internal`
          ),
          requestJSON<InquiryHistory[]>(
            `/api/sales/inquiries/${id}/history`
          ),
        ]);

      if (!Array.isArray(historyData)) {
        throw new Error(
          "Format riwayat pengajuan tidak valid."
        );
      }

      setDrafts((previous) => {
        const existing = previous[id];

        if (!existing) return previous;

        const note = detail.sales_note ?? "";

        return {
          ...previous,
          [id]: {
            ...existing,
            salesNote: note,
            originalNote: note,
            noteLoaded: true,
          },
        };
      });

      setHistory((previous) => ({
        ...previous,
        [id]: historyData,
      }));

      setExpandedId(id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat detail pengajuan."
      );
    } finally {
      setLoadingDetailId(null);
    }
  }

  async function toggleDetail(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    // Muat ulang catatan dan riwayat dari database
    // ketika panel dibuka.
    await loadDetail(id);
  }

  async function saveInquiry(item: Inquiry) {
    const draft = drafts[item.id];

    if (!draft) return;

    if (!draft.noteLoaded) {
      setError(
        "Buka detail pengajuan terlebih dahulu agar catatan lama dapat diperiksa."
      );
      return;
    }

    if (draft.salesNote.length > 2000) {
      setError(
        "Catatan Sales maksimal 2000 karakter."
      );
      return;
    }

    const noteChanged =
      draft.salesNote !== draft.originalNote;

    const statusChanged =
      draft.status !== item.status;

    if (!noteChanged && !statusChanged) {
      setNotice("Tidak ada perubahan untuk disimpan.");
      return;
    }

    setSavingId(item.id);
    setError("");
    setNotice("");

    try {
      // Jika catatan tidak berubah, sales_note
      // sengaja tidak disertakan.
      const payload: {
        status: InquiryStatus;
        sales_note?: string;
      } = {
        status: draft.status,
      };

      if (noteChanged) {
        payload.sales_note = draft.salesNote;
      }

      await requestJSON<{
        id: number;
        status: string;
      }>(
        `/api/sales/inquiries/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      // Ambil ulang daftar dari backend agar
      // status terbaru menjadi sumber kebenaran.
      const updatedItems =
        await requestJSON<Inquiry[]>(
          "/api/sales/inquiries"
        );

      setItems(updatedItems);

      setDrafts((previous) => {
        const next = { ...previous };

        for (const updated of updatedItems) {
          if (updated.id === item.id) {
            next[updated.id] = {
              status: updated.status,
              salesNote: draft.salesNote,
              originalNote: draft.salesNote,
              noteLoaded: true,
            };
          } else if (!next[updated.id]) {
            next[updated.id] = {
              status: updated.status,
              salesNote: "",
              originalNote: "",
              noteLoaded: false,
            };
          }
        }

        return next;
      });

      // Riwayat juga dimuat ulang setelah PATCH.
      const updatedHistory =
        await requestJSON<InquiryHistory[]>(
          `/api/sales/inquiries/${item.id}/history`
        );

      setHistory((previous) => ({
        ...previous,
        [item.id]: updatedHistory,
      }));

      setNotice(
        `Pengajuan #${item.id} berhasil diperbarui.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan tindak lanjut."
      );
    } finally {
      setSavingId(null);
    }
  }

  const pendingCount = items.filter(
    (item) => item.status === "pending"
  ).length;

  const activeCount = items.filter(
    (item) =>
      item.status === "contacted" ||
      item.status === "negotiating"
  ).length;

  const completedCount = items.filter(
    (item) => item.status === "completed"
  ).length;

  return (
    <div className="space-y-6 text-slate-900">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">
            Daftar Pengajuan Pembeli
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Kelola status, catatan internal, dan riwayat
            tindak lanjut calon pembeli.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setExpandedId(null);
            setNotice("");
            void loadInquiries();
          }}
          disabled={loading || savingId !== null}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Muat Ulang
        </button>
      </div>

      {/* SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <Clock3
            size={22}
            className="text-amber-600"
          />

          <p className="mt-3 text-sm text-slate-500">
            Menunggu
          </p>

          <p className="mt-1 text-2xl font-bold">
            {loading ? "—" : pendingCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <UserRound
            size={22}
            className="text-blue-700"
          />

          <p className="mt-3 text-sm text-slate-500">
            Dalam Tindak Lanjut
          </p>

          <p className="mt-1 text-2xl font-bold">
            {loading ? "—" : activeCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <CheckCircle2
            size={22}
            className="text-green-700"
          />

          <p className="mt-3 text-sm text-slate-500">
            Selesai
          </p>

          <p className="mt-1 text-2xl font-bold">
            {loading ? "—" : completedCount}
          </p>
        </div>
      </div>

      {/* FEEDBACK */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {notice}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <Loader2
            size={24}
            className="mx-auto animate-spin text-blue-700"
          />

          <p className="mt-3 text-sm text-slate-600">
            Memuat pengajuan...
          </p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <ClipboardList
            size={28}
            className="mx-auto text-slate-400"
          />

          <p className="mt-3 text-sm text-slate-600">
            Belum ada pengajuan dari pembeli.
          </p>
        </div>
      )}

      {/* INQUIRY LIST */}

      {items.map((item) => {
        const draft = drafts[item.id];

        const isExpanded = expandedId === item.id;

        const noteChanged =
          draft?.noteLoaded &&
          draft.salesNote !== draft.originalNote;

        const statusChanged =
          draft?.status !== item.status;

        const hasChanges =
          Boolean(noteChanged || statusChanged);

        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Pengajuan #{item.id}
                  </p>

                  <h3 className="mt-2 text-lg font-bold">
                    {item.car_name}
                  </h3>

                  <p className="mt-2 text-sm font-semibold text-blue-700">
                    {rupiah(item.car_price)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${
                    statusClasses[item.status] ??
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {statusLabel(item.status)}
                </span>
              </div>

              <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="text-slate-500">
                    Nama Pembeli
                  </p>

                  <p className="mt-1 font-semibold">
                    {item.buyer_name}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Email Pembeli
                  </p>

                  <p className="mt-1 break-all font-medium">
                    {item.buyer_email}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Tanggal Pengajuan
                  </p>

                  <p className="mt-1">
                    {formatDate(item.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Pembaruan Terakhir
                  </p>

                  <p className="mt-1">
                    {formatDate(item.updated_at)}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-bold">
                  Pesan Pembeli
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {item.message}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void toggleDetail(item.id)
                  }
                  disabled={loadingDetailId !== null}
                  aria-expanded={isExpanded}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {loadingDetailId === item.id ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <ClipboardList size={16} />
                  )}

                  {isExpanded
                    ? "Tutup Tindak Lanjut"
                    : "Kelola Pengajuan"}
                </button>

                <Link
                  href={`/mobil/${item.car_id}`}
                  className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Detail Mobil
                </Link>
              </div>
            </div>

            {/* EXPANDED DETAILS */}

            {isExpanded && draft && (
              <div className="border-t border-slate-200 bg-slate-50 p-6">
                <h4 className="font-bold">
                  Tindak Lanjut Sales
                </h4>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {/* STATUS */}

                  <div>
                    <label
                      htmlFor={`status-${item.id}`}
                      className="block text-sm font-semibold"
                    >
                      Status Pengajuan
                    </label>

                    <select
                      id={`status-${item.id}`}
                      value={draft.status}
                      onChange={(event) =>
                        updateDraft(item.id, {
                          status: event.target
                            .value as InquiryStatus,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600"
                    >
                      {statuses.map((status) => (
                        <option
                          key={status.value}
                          value={status.value}
                        >
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SALES NOTE */}

                  <div>
                    <label
                      htmlFor={`note-${item.id}`}
                      className="block text-sm font-semibold"
                    >
                      Catatan Internal Sales
                    </label>

                    <textarea
                      id={`note-${item.id}`}
                      rows={4}
                      maxLength={2000}
                      value={draft.salesNote}
                      onChange={(event) =>
                        updateDraft(item.id, {
                          salesNote: event.target.value,
                        })
                      }
                      placeholder="Catatan tindak lanjut..."
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 text-sm outline-none focus:border-blue-600"
                    />

                    <div className="mt-2 flex justify-between gap-2 text-xs text-slate-500">
                      <span>
                        {noteChanged
                          ? "Catatan telah diubah."
                          : "Catatan belum diubah."}
                      </span>

                      <span>
                        {draft.salesNote.length}/2000
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Catatan ini hanya untuk Sales dan
                      tidak ditampilkan kepada pembeli.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void saveInquiry(item)
                    }
                    disabled={
                      savingId !== null ||
                      !draft.noteLoaded ||
                      !hasChanges
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    {savingId === item.id ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={16} />
                    )}

                    {savingId === item.id
                      ? "Menyimpan..."
                      : "Simpan Tindak Lanjut"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateDraft(item.id, {
                        status: item.status,
                        salesNote: draft.originalNote,
                      });
                    }}
                    disabled={savingId !== null}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Batalkan Perubahan
                  </button>
                </div>

                {/* STATUS HISTORY */}

                <div className="mt-8 border-t border-slate-200 pt-6">
                  <div className="flex items-center gap-2">
                    <History
                      size={20}
                      className="text-blue-700"
                    />

                    <h4 className="font-bold">
                      Riwayat Perubahan Status
                    </h4>
                  </div>

                  {(history[item.id] ?? []).length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">
                      Belum ada perubahan status yang
                      tercatat.
                    </p>
                  ) : (
                    <ol className="mt-5 space-y-3">
                      {history[item.id].map((entry) => (
                        <li
                          key={entry.id}
                          className="rounded-xl border border-slate-200 bg-white p-4"
                        >
                          <p className="text-sm font-semibold">
                            {statusLabel(
                              entry.old_status
                            )}
                            {" → "}
                            {statusLabel(
                              entry.new_status
                            )}
                          </p>

                          <p className="mt-2 text-xs text-slate-500">
                            {formatDate(
                              entry.changed_at ??
                                entry.created_at
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            ID Sales: {entry.changed_by}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
