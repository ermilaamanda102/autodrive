
import { NextRequest, NextResponse } from "next/server";

type LoginResponse = {
  status?: string;
  message?: string;
  token?: string;
  data?: {
    token?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validasi input
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json(
        {
          status: "error",
          message: "Email dan password wajib diisi",
        },
        { status: 400 }
      );
    }

    // URL backend Golang
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        {
          status: "error",
          message: "API_URL belum dikonfigurasi di .env.local",
        },
        { status: 500 }
      );
    }

    // Mengirim login ke backend Golang
    let response: Response;

    try {
      response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      console.error("Koneksi backend gagal:", error);

      return NextResponse.json(
        {
          status: "error",
          message:
            "Tidak dapat terhubung ke backend Golang. Pastikan backend berjalan di port 8080.",
        },
        { status: 503 }
      );
    }

    // Membaca respons backend
    let result: LoginResponse;

    try {
      result = (await response.json()) as LoginResponse;
    } catch {
      return NextResponse.json(
        {
          status: "error",
          message: "Respons backend bukan JSON yang valid",
        },
        { status: 502 }
      );
    }

    // Jika backend menolak login
    if (!response.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: result.message || "Email atau password salah",
        },
        { status: response.status },
      );
    }

    // Mendukung token langsung maupun di dalam data
    const token =
      typeof result.token === "string"
        ? result.token
        : typeof result.data?.token === "string"
          ? result.data.token
          : null;

    if (!token) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Login diterima backend, tetapi token JWT tidak ditemukan dalam respons",
        },
        { status: 502 }
      );
    }

    // Menyimpan JWT di cookie HttpOnly
    const nextResponse = NextResponse.json({
      status: "success",
      message: "Login berhasil",
    });

    nextResponse.cookies.set("autodrive_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return nextResponse;
  } catch (error) {
    console.error("Login API error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Terjadi kesalahan pada server login",
      },
      { status: 500 }
    );
  }
}
