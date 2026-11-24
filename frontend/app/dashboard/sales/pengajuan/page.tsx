
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth";
import SalesInquiryManager from "../../../../components/inquiries/SalesInquiryManager";

export default async function SalesInquiriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "sales") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
          Sales AutoDrive
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Pengelolaan Pengajuan Minat
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Tindak lanjuti pengajuan kendaraan dari pembeli.
        </p>
      </div>

      <SalesInquiryManager />
    </div>
  );
}
