import { inquiryApi } from "../../../../../../lib/inquiry-api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return Response.json({ status: "error", message: "ID pengajuan tidak valid." }, { status: 400 });
  }
  return inquiryApi(`/api/sales/inquiries/${id}/history`, "GET");
}
