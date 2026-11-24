
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth";
import CarManager from "../../../../components/admin/CarManager";

export const instant = false;

export default async function AdminMobilPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return <CarManager />;
}
