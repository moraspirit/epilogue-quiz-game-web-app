import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";
import {
  CACHE_TTL,
  cacheGet,
  cacheSet,
} from "@/lib/cache";
import { getUserLevelStatus } from "@/lib/quizProgress";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const userId = Number(payload.id);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 });
    }

    const userProgressCacheKey = `user:progress:${userId}`;
    let levelsWithStatus = await cacheGet<
      Awaited<ReturnType<typeof getUserLevelStatus>>
    >(userProgressCacheKey);

    if (!levelsWithStatus) {
      levelsWithStatus = await getUserLevelStatus(userId);
      await cacheSet(
        userProgressCacheKey,
        levelsWithStatus,
        CACHE_TTL.USER_PROGRESS
      );
    }

    return NextResponse.json({
      success: true,
      levels: levelsWithStatus,
    });
  } catch (error) {
    console.error("Error fetching levels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
