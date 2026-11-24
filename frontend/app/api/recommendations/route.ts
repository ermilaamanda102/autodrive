
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    console.error("API_URL belum dikonfigurasi");

    return NextResponse.json(
      {
        status: "error",
        message: "API_URL belum dikonfigurasi",
      },
      { status: 500 }
    );
  }

  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      {
        status: "error",
        message: "Origin tidak diizinkan",
      },
      { status: 403 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Format JSON tidak valid",
      },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${apiUrl}/api/recommendations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "Backend rekomendasi mengembalikan HTTP:",
        response.status,
        result
      );
    }

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      "Gagal menghubungi backend rekomendasi:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Gagal menghubungi layanan rekomendasi",
      },
      { status: 502 }
    );
  }
}
