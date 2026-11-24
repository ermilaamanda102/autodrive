
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "API_URL belum dikonfigurasi" },
      { status: 500 }
    );
  }

  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Origin tidak diizinkan" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(
      `${apiUrl}/api/recommendations/sensitivity`,
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

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch (error) {
    console.error("Sensitivity API error:", error);

    return NextResponse.json(
      {
        message: "Gagal menghubungi backend analisis sensitivitas",
      },
      { status: 502 }
    );
  }
}
