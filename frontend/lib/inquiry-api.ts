
import "server-only";
import { cookies } from "next/headers";

export async function inquiryApi(
  path: string,
  method: "GET" | "POST" | "PATCH",
  body?: unknown
): Promise<Response> {
  const store = await cookies();
  const token = store.get("autodrive_session")?.value;

  if (!token) {
    return Response.json(
      { status: "error", message: "Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    return Response.json(
      { status: "error", message: "Konfigurasi API_URL belum tersedia." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body === undefined
            ? {}
            : { "Content-Type": "application/json" }),
        },
        ...(body === undefined
          ? {}
          : { body: JSON.stringify(body) }),
        cache: "no-store",
      }
    );

    const result = await response.json().catch(() => ({
      status: "error",
      message: "Respons backend tidak valid.",
    }));

    return Response.json(result, {
      status: response.status,
    });
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Backend AutoDrive tidak dapat dihubungi.",
      },
      { status: 502 }
    );
  }
}
