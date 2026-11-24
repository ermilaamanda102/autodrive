
import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getDashboardPath,
} from "../../lib/auth";

export const instant = false;

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  redirect(getDashboardPath(user.role));
}
