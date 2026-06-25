import { NextResponse } from "next/server";

export const USER_SESSION_COOKIE = "user_session";
const LEGACY_TOKEN_KEY = "token";

export function parseDurationToSeconds(value: string): number {
  const match = value.trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 7 * 24 * 60 * 60;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s":
      return amount;
    case "m":
      return amount * 60;
    case "h":
      return amount * 3600;
    case "d":
      return amount * 24 * 60 * 60;
    default:
      return 7 * 24 * 60 * 60;
  }
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function applyUserSessionCookie(
  response: NextResponse,
  token: string
): NextResponse {
  response.cookies.set(USER_SESSION_COOKIE, token, {
    ...sessionCookieOptions(),
    maxAge: parseDurationToSeconds(process.env.JWT_EXPIRES_IN || "7d"),
  });

  return response;
}

export function clearUserSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(USER_SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}

export function clearLegacyBrowserToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(LEGACY_TOKEN_KEY);
}
