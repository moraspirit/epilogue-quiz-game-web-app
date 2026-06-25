import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { USER_SESSION_COOKIE } from "@/lib/authSession";
import { extractTokenFromHeader, verifyToken } from "@/lib/jwt";

export type AuthUser = {
  id: number;
  indexNumber: string;
  name: string;
};

async function readSessionToken(req?: NextRequest | Request): Promise<string | null> {
  if (req instanceof NextRequest) {
    const cookieToken = req.cookies.get(USER_SESSION_COOKIE)?.value;
    if (cookieToken) {
      return cookieToken;
    }
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(USER_SESSION_COOKIE)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  if (req) {
    return extractTokenFromHeader(req.headers.get("authorization"));
  }

  return null;
}

export async function getAuthenticatedUser(
  req?: NextRequest | Request
): Promise<AuthUser | null> {
  const token = await readSessionToken(req);
  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token);
    if (payload.role === "admin") {
      return null;
    }

    const userId = Number(payload.id);
    if (Number.isNaN(userId)) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        indexNumber: true,
        name: true,
        role: true,
      },
    });

    if (!user || user.role !== "USER") {
      return null;
    }

    return {
      id: user.id,
      indexNumber: user.indexNumber ?? "",
      name: user.name,
    };
  } catch {
    return null;
  }
}
