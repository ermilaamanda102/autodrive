
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";

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
  status: string;
  image_url: string;
};

type CarForm = Omit<Car, "id">;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function createEmptyForm(): CarForm {
  return {
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    price: 0,
    transmission: "Manual",
    fuel_type: "Bensin",
    seats: 5,
    description: "",
    status: "available",
    image_url: "",
  };
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPriceInput(value: string): string {
  if (!value) return "";

  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan. Silakan coba lagi.";
}

async function readApiResponse(response: Response) {
  const result = await response.json().catch(() => null);

  if (!response.ok || result?.status === "error") {
    throw new Error(
      typeof result?.message === "string"
        ? result.message
        : `Permintaan gagal (HTTP ${response.status})`
    );
  }

  return result;
}

function isValidImageUrl(value: string): boolean {
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

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 " +
  "bg-white px-4 py-3 text-sm text-slate-900 " +
  "placeholder:text-slate-400 outline-none " +
  "focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

const labelClass =
  "block text-sm font-semibold text-slate-800";

export default function CarManager() {
  const [cars, setCars] = useState<Car[]>([]);
  const [form, setForm] = useState<CarForm>(
    createEmptyForm
  );

  // State khusus harga agar kolom bisa benar-benar kosong.
  const [priceInput, setPriceInput] = useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = saving || uploading;

  // ==========================================
  // LOAD CARS
  // ==========================================

  const loadCars = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/cars", {
        cache: "no-store",
      });

      const result = await readApiResponse(response);

      if (!Array.isArray(result?.data)) {
        throw new Error(
          "Format data mobil dari server tidak valid."
        );
      }

      setCars(result.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCars();
  }, [loadCars]);

  // ==========================================
  // UPDATE FORM
  // ==========================================

  function updateField<K extends keyof CarForm>(
    field: K,
    value: CarForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (field === "image_url") {
      setImageFailed(false);
    }
  }

  // ==========================================
  // PRICE INPUT
  // ==========================================

  function handlePriceChange(value: string) {
    const digits = value.replace(/\D/g, "");

    // Jangan langsung mengganti input kosong dengan 0.
    if (digits === "") {
      setPriceInput("");
      updateField("price", 0);
      return;
    }

    const normalized =
      digits.replace(/^0+/, "") || "0";

    const numericValue = Number(normalized);

    if (!Number.isSafeInteger(numericValue)) {
      setError("Harga yang dimasukkan terlalu besar.");
      return;
    }

    setPriceInput(normalized);
    updateField("price", numericValue);
    setError("");
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // ==========================================
  // CREATE
  // ==========================================

  function startCreate() {
    if (busy) return;

    setForm(createEmptyForm());
    setPriceInput("");
    setEditingId(null);
    setShowForm(true);
    setError("");
    setMessage("");
    setImageFailed(false);
    resetFileInput();
  }

  // ==========================================
  // EDIT
  // ==========================================

  function startEdit(car: Car) {
    if (busy) return;

    setForm({
      brand: car.brand,
      model: car.model,
      year: car.year,
      price: car.price,
      transmission: car.transmission,
      fuel_type: car.fuel_type,
      seats: car.seats,
      description: car.description ?? "",
      status: car.status,
      image_url: car.image_url ?? "",
    });

    setPriceInput(String(car.price));
    setEditingId(car.id);
    setShowForm(true);
    setError("");
    setMessage("");
    setImageFailed(false);
    resetFileInput();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==========================================
  // CLOSE FORM
  // ==========================================

  function closeForm() {
    if (busy) return;

    setShowForm(false);
    setEditingId(null);
    setForm(createEmptyForm());
    setPriceInput("");
    setError("");
    setImageFailed(false);
    resetFileInput();
  }

  // ==========================================
  // CLOUDINARY UPLOAD
  // ==========================================

  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file || busy) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(
        "Format gambar harus JPG, PNG, atau WebP."
      );
      resetFileInput();
      return;
    }

    if (
      file.size === 0 ||
      file.size > MAX_IMAGE_SIZE
    ) {
      setError(
        "Ukuran gambar harus lebih dari 0 dan maksimal 5 MB."
      );
      resetFileInput();
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/admin/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await readApiResponse(response);
      const imageUrl = result?.data?.image_url;

      if (
        typeof imageUrl !== "string" ||
        !isValidImageUrl(imageUrl)
      ) {
        throw new Error(
          "URL foto dari Cloudinary tidak valid."
        );
      }

      updateField("image_url", imageUrl);

      setMessage(
        "Foto berhasil diunggah. Klik Simpan untuk menyimpan data mobil."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
      resetFileInput();
    }
  }

  // ==========================================
  // SAVE CAR
  // ==========================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (busy) return;

    if (
      !form.brand.trim() ||
      !form.model.trim() ||
      !Number.isInteger(form.year) ||
      form.year < 1900 ||
      form.year > 2100 ||
      !Number.isSafeInteger(form.price) ||
      form.price <= 0 ||
      !Number.isInteger(form.seats) ||
      form.seats < 1 ||
      form.seats > 100
    ) {
      setError(
        "Periksa merek, model, tahun, harga, dan jumlah kursi."
      );
      return;
    }

    const imageUrl = form.image_url.trim();

    if (imageUrl && !isValidImageUrl(imageUrl)) {
      setError(
        "URL foto harus menggunakan HTTPS dari Cloudinary."
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const isEditing = editingId !== null;

      const endpoint = isEditing
        ? `/api/admin/cars/${editingId}`
        : "/api/admin/cars";

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          brand: form.brand.trim(),
          model: form.model.trim(),
          description: form.description.trim(),
          image_url: imageUrl,
        }),
      });

      await readApiResponse(response);
      await loadCars();

      setShowForm(false);
      setEditingId(null);
      setForm(createEmptyForm());
      setPriceInput("");
      setImageFailed(false);
      resetFileInput();

      setMessage(
        isEditing
          ? "Data mobil berhasil diperbarui."
          : "Mobil baru berhasil ditambahkan."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // DELETE CAR
  // ==========================================

  async function handleDelete(car: Car) {
    if (busy || deletingId !== null) return;

    const confirmed = window.confirm(
      `Yakin ingin menghapus ${car.brand} ${car.model}?\n\n` +
        "Data mobil akan dihapus permanen."
    );

    if (!confirmed) return;

    setDeletingId(car.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/cars/${car.id}`,
        {
          method: "DELETE",
        }
      );

      await readApiResponse(response);
      await loadCars();

      setMessage(
        `${car.brand} ${car.model} berhasil dihapus.`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  const available = cars.filter(
    (car) => car.status === "available"
  ).length;

  const sold = cars.filter(
    (car) => car.status === "sold"
  ).length;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-7 text-slate-900">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Manajemen Mobil
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Kelola inventaris kendaraan AutoDrive.
          </p>
        </div>

        <button
          type="button"
          onClick={startCreate}
          disabled={busy}
          className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          + Tambah Mobil
        </button>
      </div>

      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Mobil", value: cars.length },
          { label: "Tersedia", value: available },
          { label: "Terjual", value: sold },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600">
              {item.label}
            </p>

            <p className="mt-3 text-3xl font-bold">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* MESSAGES */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800"
        >
          {message}
        </div>
      )}

      {/* FORM */}

      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-7 flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-xl font-bold">
                {editingId !== null
                  ? "Edit Data Mobil"
                  : "Tambah Mobil Baru"}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Lengkapi informasi kendaraan dengan benar.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={busy}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50"
            >
              Tutup
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* VEHICLE INFORMATION */}

            <div>
              <h3 className="text-lg font-bold">
                1. Informasi Kendaraan
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Masukkan identitas dan spesifikasi mobil.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="brand"
                    className={labelClass}
                  >
                    Merek Mobil *
                  </label>

                  <input
                    id="brand"
                    required
                    maxLength={100}
                    value={form.brand}
                    onChange={(e) =>
                      updateField("brand", e.target.value)
                    }
                    placeholder="Contoh: Toyota"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="model"
                    className={labelClass}
                  >
                    Model Mobil *
                  </label>

                  <input
                    id="model"
                    required
                    maxLength={100}
                    value={form.model}
                    onChange={(e) =>
                      updateField("model", e.target.value)
                    }
                    placeholder="Contoh: Avanza"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="year"
                    className={labelClass}
                  >
                    Tahun Produksi *
                  </label>

                  <input
                    id="year"
                    type="number"
                    min={1900}
                    max={2100}
                    required
                    value={form.year}
                    onChange={(e) =>
                      updateField(
                        "year",
                        Number(e.target.value)
                      )
                    }
                    className={inputClass}
                  />
                </div>

                {/* FIXED PRICE INPUT */}

                <div>
                  <label
                    htmlFor="price"
                    className={labelClass}
                  >
                    Harga Mobil (Rp) *
                  </label>

                  <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                    <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
                      Rp
                    </span>

                    <input
                      id="price"
                      type="text"
                      inputMode="numeric"
                      required
                      value={formatPriceInput(priceInput)}
                      onChange={(event) =>
                        handlePriceChange(event.target.value)
                      }
                      placeholder="185.000.000"
                      className="w-full min-w-0 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <p className="mt-2 text-xs font-medium text-blue-700">
                    {priceInput
                      ? formatRupiah(form.price)
                      : "Masukkan harga kendaraan."}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="transmission"
                    className={labelClass}
                  >
                    Transmisi
                  </label>

                  <select
                    id="transmission"
                    value={form.transmission}
                    onChange={(e) =>
                      updateField(
                        "transmission",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="CVT">CVT</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="fuel_type"
                    className={labelClass}
                  >
                    Bahan Bakar
                  </label>

                  <select
                    id="fuel_type"
                    value={form.fuel_type}
                    onChange={(e) =>
                      updateField(
                        "fuel_type",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="Bensin">Bensin</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Listrik">Listrik</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="seats"
                    className={labelClass}
                  >
                    Jumlah Kursi *
                  </label>

                  <input
                    id="seats"
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={form.seats}
                    onChange={(e) =>
                      updateField(
                        "seats",
                        Number(e.target.value)
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className={labelClass}
                  >
                    Status Mobil
                  </label>

                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) =>
                      updateField(
                        "status",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="available">Tersedia</option>
                    <option value="sold">Terjual</option>
                  </select>
                </div>
              </div>
            </div>

            {/* IMAGE SECTION */}

            <div className="border-t border-slate-200 pt-7">
              <h3 className="text-lg font-bold">
                2. Foto Kendaraan
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Tempel URL Cloudinary atau unggah foto.
              </p>

              <div className="mt-5 space-y-5">
                <div>
                  <label
                    htmlFor="image_url"
                    className={labelClass}
                  >
                    URL Foto Mobil (Cloudinary)
                  </label>

                  <input
                    id="image_url"
                    type="url"
                    value={form.image_url}
                    onChange={(e) =>
                      updateField(
                        "image_url",
                        e.target.value
                      )
                    }
                    placeholder="https://res.cloudinary.com/..."
                    className={inputClass}
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    URL gambar akan disimpan bersama data mobil.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-bold text-slate-500">
                    ATAU
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div>
                  <label
                    htmlFor="car_photo"
                    className={labelClass}
                  >
                    Upload Foto Mobil
                  </label>

                  <input
                    ref={fileInputRef}
                    id="car_photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={busy}
                    className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700`}
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    JPG, PNG, atau WebP. Maksimal 5 MB.
                  </p>

                  {uploading && (
                    <p
                      role="status"
                      className="mt-3 text-sm font-semibold text-blue-700"
                    >
                      Sedang mengunggah foto ke Cloudinary...
                    </p>
                  )}
                </div>

                <div>
                  <p className={labelClass}>
                    Pratinjau Foto Mobil
                  </p>

                  <div className="relative mt-3 flex h-64 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                    {form.image_url &&
                    isValidImageUrl(form.image_url) &&
                    !imageFailed ? (
                      <Image
                        key={form.image_url}
                        src={form.image_url}
                        alt={`Foto ${form.brand} ${form.model}`}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 700px"
                        className="object-contain p-3"
                        onError={() =>
                          setImageFailed(true)
                        }
                      />
                    ) : (
                      <div className="px-4 text-center">
                        <p className="text-sm font-semibold text-slate-500">
                          {imageFailed
                            ? "Gambar gagal dimuat"
                            : "Belum ada foto mobil"}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          Masukkan URL Cloudinary atau unggah foto.
                        </p>
                      </div>
                    )}
                  </div>

                  {form.image_url && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateField("image_url", "")
                      }
                      className="mt-3 text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
                    >
                      Hapus Foto dari Formulir
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}

            <div className="border-t border-slate-200 pt-7">
              <h3 className="text-lg font-bold">
                3. Informasi Tambahan
              </h3>

              <div className="mt-5">
                <label
                  htmlFor="description"
                  className={labelClass}
                >
                  Deskripsi Mobil
                </label>

                <textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    updateField(
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Kondisi, fitur, dan keunggulan kendaraan..."
                  className={inputClass}
                />
              </div>
            </div>

            {/* ACTIONS */}

            <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-blue-700 px-7 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : uploading
                    ? "Menunggu Upload..."
                    : editingId !== null
                      ? "Simpan Perubahan"
                      : "Tambah Mobil"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                disabled={busy}
                className="rounded-xl border border-slate-300 px-7 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </form>
        </section>
      )}

      {/* CAR TABLE */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h2 className="text-lg font-bold">
            Daftar Mobil
          </h2>

          <button
            type="button"
            onClick={() => void loadCars()}
            disabled={loading}
            className="text-sm font-semibold text-blue-700 hover:underline disabled:opacity-50"
          >
            Muat Ulang
          </button>
        </div>

        {loading ? (
          <p className="p-6 text-slate-600">
            Memuat data mobil...
          </p>
        ) : cars.length === 0 ? (
          <p className="p-8 text-center text-slate-600">
            Belum ada data mobil.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-5 py-4">Mobil</th>
                  <th className="px-5 py-4">Tahun</th>
                  <th className="px-5 py-4">Harga</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {cars.map((car) => (
                  <tr key={car.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {car.image_url &&
                          isValidImageUrl(car.image_url) ? (
                            <Image
                              src={car.image_url}
                              alt={`${car.brand} ${car.model}`}
                              fill
                              unoptimized
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-400">
                              No Foto
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-semibold">
                            {car.brand} {car.model}
                          </p>
                          <p className="text-xs text-slate-500">
                            ID: {car.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {car.year}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {formatRupiah(car.price)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          car.status === "available"
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800"
                            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        }
                      >
                        {car.status === "available"
                          ? "Tersedia"
                          : "Terjual"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => startEdit(car)}
                          disabled={
                            busy || deletingId !== null
                          }
                          className="font-semibold text-blue-700 hover:underline disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(car)
                          }
                          disabled={
                            busy || deletingId !== null
                          }
                          className="font-semibold text-red-600 hover:underline disabled:opacity-50"
                        >
                          {deletingId === car.id
                            ? "Menghapus..."
                            : "Hapus"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
