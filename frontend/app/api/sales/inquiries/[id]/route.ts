
import { inquiryApi } from "../../../../../lib/inquiry-api";

// ==========================================
// ROUTE TYPES
// ==========================================

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateInquiryBody = {
  status?: unknown;
  sales_note?: unknown;
};

// ==========================================
// VALID STATUS
// ==========================================

const VALID_STATUSES = [
  "pending",
  "contacted",
  "negotiating",
  "completed",
  "cancelled",
] as const;

// ==========================================
// RESPONSE HELPER
// ==========================================

function errorResponse(
  message: string,
  status: number = 400
): Response {
  return Response.json(
    {
      status: "error",
      message,
    },
    {
      status,
    }
  );
}

// ==========================================
// VALIDATE INQUIRY ID
// ==========================================

function isValidId(id: string): boolean {
  if (!/^[1-9]\d*$/.test(id)) {
    return false;
  }

  const parsedId = Number(id);

  return (
    Number.isSafeInteger(parsedId) &&
    parsedId > 0
  );
}

// ==========================================
// VALIDATE INQUIRY STATUS
// ==========================================

function isValidStatus(
  value: unknown
): value is (typeof VALID_STATUSES)[number] {
  return (
    typeof value === "string" &&
    VALID_STATUSES.some(
      (status) => status === value
    )
  );
}

// ==========================================
// GET INQUIRY DETAIL
// GET /api/sales/inquiries/:id
// ==========================================

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const { id } = await context.params;

  if (!isValidId(id)) {
    return errorResponse(
      "ID pengajuan tidak valid."
    );
  }

  return inquiryApi(
    `/api/sales/inquiries/${id}`,
    "GET"
  );
}

// ==========================================
// UPDATE INQUIRY STATUS
// PATCH /api/sales/inquiries/:id
// ==========================================

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<Response> {
  // ------------------------------------------
  // VALIDATE ID
  // ------------------------------------------

  const { id } = await context.params;

  if (!isValidId(id)) {
    return errorResponse(
      "ID pengajuan tidak valid."
    );
  }

  // ------------------------------------------
  // PARSE REQUEST BODY
  // ------------------------------------------

  let body: UpdateInquiryBody;

  try {
    const parsed: unknown = await request.json();

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return errorResponse(
        "Format data pengajuan tidak valid."
      );
    }

    body = parsed as UpdateInquiryBody;
  } catch {
    return errorResponse(
      "Body request harus berupa JSON yang valid."
    );
  }

  // ------------------------------------------
  // VALIDATE STATUS
  // ------------------------------------------

  if (!isValidStatus(body.status)) {
    return errorResponse(
      "Status pengajuan tidak valid. " +
        "Gunakan pending, contacted, negotiating, " +
        "completed, atau cancelled."
    );
  }

  // ------------------------------------------
  // VALIDATE SALES NOTE
  // ------------------------------------------

  if (
    body.sales_note !== undefined &&
    typeof body.sales_note !== "string"
  ) {
    return errorResponse(
      "Catatan Sales harus berupa teks."
    );
  }

  if (
    typeof body.sales_note === "string" &&
    Array.from(body.sales_note).length > 2000
  ) {
    return errorResponse(
      "Catatan Sales maksimal 2000 karakter."
    );
  }

  // ------------------------------------------
  // BUILD UPDATE PAYLOAD
  // ------------------------------------------

  const payload: {
    status: (typeof VALID_STATUSES)[number];
    sales_note?: string;
  } = {
    status: body.status,
  };

  // Penting:
  // Jika sales_note tidak dikirim, jangan
  // tambahkan properti tersebut ke payload.
  //
  // Backend akan mempertahankan catatan lama.
  //
  // Jika sales_note dikirim sebagai "",
  // backend boleh mengosongkan catatan
  // sesuai tindakan pengguna.

  if (typeof body.sales_note === "string") {
    payload.sales_note = body.sales_note.trim();
  }

  // ------------------------------------------
  // FORWARD REQUEST TO GOLANG BACKEND
  // ------------------------------------------

  return inquiryApi(
    `/api/sales/inquiries/${id}`,
    "PATCH",
    payload
  );
}
