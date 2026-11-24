
import { inquiryApi } from "../../../../lib/inquiry-api";

export async function GET() {
  return inquiryApi("/api/sales/inquiries", "GET");
}
