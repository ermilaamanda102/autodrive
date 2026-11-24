
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

async function getToken() {
  const store = await cookies();
  return store.get("autodrive_session")?.value;
}

export async function GET() {
  const token = await getToken();

  if (!token) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  if (!API_URL) {
    return NextResponse.json(
      { message: "API_URL belum dikonfigurasi" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/cars`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Gagal menghubungi backend" },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const token = await getToken();

  if (!token) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  if (!API_URL) {
    return NextResponse.json(
      { message: "API_URL belum dikonfigurasi" },
      { status: 500 }
    );
  }

  // Pertahanan tambahan terhadap permintaan lintas origin.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Origin tidak diizinkan" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/api/admin/cars`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Gagal memproses permintaan" },
      { status: 502 }
    );
  }
}
