
import "server-only";
import { cookies } from "next/headers";

export type UserRole = "admin" | "sales" | "buyer";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("autodrive_session")?.value;

  if (!token) return null;

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("API_URL belum dikonfigurasi");
  }

  try {
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const result = await response.json();
    const user = result.data;

    if (
      !user ||
      typeof user.id !== "number" ||
      typeof user.name !== "string" ||
      typeof user.email !== "string" ||
      !["admin", "sales", "buyer"].includes(user.role)
    ) {
      return null;
    }

    return user as AuthUser;
  } catch {
    return null;
  }
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "sales":
      return "/dashboard/sales";
    case "buyer":
      return "/dashboard/pembeli";
  }
}
