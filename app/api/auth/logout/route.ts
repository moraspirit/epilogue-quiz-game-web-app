import { NextResponse } from "next/server";
import { clearUserSessionCookie } from "@/lib/authSession";

export async function POST() {
  const response = NextResponse.json({ success: true });
  return clearUserSessionCookie(response);
}
