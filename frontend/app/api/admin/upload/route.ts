
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "../../../../lib/auth";


const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function isValidImage(
  bytes: Buffer,
  type: string
): boolean {
  if (type === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (type === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(
        Buffer.from([
          137, 80, 78, 71, 13, 10, 26, 10,
        ])
      )
    );
  }

  if (type === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    );
  }

  return false;
}

export async function POST(request: NextRequest) {
  // 1. Periksa origin permintaan.
  const origin = request.headers.get("origin");

  if (origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Origin tidak diizinkan" },
      { status: 403 }
    );
  }

  // 2. Pastikan pengguna adalah Admin.
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      { message: "Akses hanya untuk Admin" },
      { status: 403 }
    );
  }

  // 3. Periksa konfigurasi Cloudinary.
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { message: "Konfigurasi Cloudinary belum lengkap" },
      { status: 500 }
    );
  }

  try {
    // 4. Baca file dari FormData.
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "File gambar wajib dipilih" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          message:
            "Format gambar harus JPG, PNG, atau WebP",
        },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Ukuran gambar maksimal 5 MB" },
        { status: 400 }
      );
    }

    // 5. Periksa signature awal file.
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!isValidImage(buffer, file.type)) {
      return NextResponse.json(
        { message: "Isi file bukan gambar yang valid" },
        { status: 400 }
      );
    }

    // 6. Konfigurasi Cloudinary di server.
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    // 7. Upload menggunakan stream.
    const uploaded = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "autodrive/cars",
          resource_type: "image",
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(
              error ?? new Error("Upload gagal")
            );
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );

      stream.end(buffer);
    });

    // 8. Kembalikan URL gambar.
    return NextResponse.json({
      status: "success",
      message: "Foto berhasil diunggah",
      data: {
        image_url: uploaded.secure_url,
        public_id: uploaded.public_id,
      },
    });
  } catch (error) {
    console.error("Cloudinary upload gagal:", error);

    return NextResponse.json(
      { message: "Gagal mengunggah foto mobil" },
      { status: 500 }
    );
  }
}
