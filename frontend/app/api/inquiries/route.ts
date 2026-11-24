
import { inquiryApi } from "../../../lib/inquiry-api";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    !Number.isSafeInteger(body.car_id) ||
    body.car_id <= 0 ||
    typeof body.message !== "string"
  ) {
    return Response.json(
      {
        status: "error",
        message: "Data pengajuan tidak valid.",
      },
      { status: 400 }
    );
  }

  return inquiryApi("/api/inquiries", "POST", {
    car_id: body.car_id,
    message: body.message,
  });
}
