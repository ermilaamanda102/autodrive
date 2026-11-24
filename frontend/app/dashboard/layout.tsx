import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";

// Mempertahankan konfigurasi yang sudah
// digunakan pada project AutoDrive.
export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mengambil data pengguna dari sesi login (cookie HttpOnly).
  const user = await getCurrentUser();

  // Jika belum login, arahkan ke halaman login.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:py-8">
        <DashboardSidebar name={user.name} role={user.role} />

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}