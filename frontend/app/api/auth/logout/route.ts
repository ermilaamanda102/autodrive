
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    status: "success",
    message: "Logout berhasil",
  });

  response.cookies.set("autodrive_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
