
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const API_URL = process.env.API_URL;

async function getToken() {
  const store = await cookies();
  return store.get("autodrive_session")?.value;
}

function checkOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

async function forwardRequest(
  request: NextRequest,
  context: RouteContext,
  method: "PUT" | "DELETE"
) {
  const token = await getToken();

  if (!token) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  if (!checkOrigin(request)) {
    return NextResponse.json(
      { message: "Origin tidak diizinkan" },
      { status: 403 }
    );
  }

  if (!API_URL) {
    return NextResponse.json(
      { message: "API_URL belum dikonfigurasi" },
      { status: 500 }
    );
  }

  const { id } = await context.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return NextResponse.json(
      { message: "ID mobil tidak valid" },
      { status: 400 }
    );
  }

  try {
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === "PUT"
          ? { "Content-Type": "application/json" }
          : {}),
      },
      cache: "no-store",
    };

    if (method === "PUT") {
      const body = await request.json();
      options.body = JSON.stringify(body);
    }

    const response = await fetch(
      `${API_URL}/api/admin/cars/${id}`,
      options
    );

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

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  return forwardRequest(request, context, "PUT");
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  return forwardRequest(request, context, "DELETE");
}
