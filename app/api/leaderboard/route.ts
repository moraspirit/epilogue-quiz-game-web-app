import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/jwt";
import {
  CACHE_TTL,
  cacheGet,
  cacheSet,
} from "@/lib/cache";
import { getUserQuizStats } from "@/lib/quizProgress";

const TOP_LIMIT = 20;

type LeaderboardEntry = {
  id: number;
  name: string;
  score: number;
  status: "Playing" | "Completed" | "Idle";
  rank: number;
};

type LeaderboardEntryWithIndex = LeaderboardEntry & {
  indexNumber: string;
};

async function buildLeaderboard(): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    select: {
      id: true,
      name: true,
    },
  });

  const entries = await Promise.all(
    users.map(async (user) => {
      const stats = await getUserQuizStats(user.id);

      return {
        id: user.id,
        name: user.name,
        score: stats.score,
        status: stats.status,
        rank: 0,
      };
    })
  );

  return entries
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export async function GET(req: Request) {
  try {
    const cacheKey = "leaderboard:full";
    let rankedLeaderboard = await cacheGet<LeaderboardEntry[]>(cacheKey);

    if (!rankedLeaderboard) {
      rankedLeaderboard = await buildLeaderboard();
      await cacheSet(cacheKey, rankedLeaderboard, CACHE_TTL.LEADERBOARD);
    }

    const topLeaderboard = rankedLeaderboard.slice(0, TOP_LIMIT);

    let currentUser: LeaderboardEntryWithIndex | null = null;
    let viewer: { userId: number; indexNumber: string } | null = null;
    const authHeader = req.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const payload = await verifyToken(token);
        const userId = Number(payload.id);

        if (!Number.isNaN(userId)) {
          const userRecord = await prisma.user.findUnique({
            where: { id: userId },
            select: { indexNumber: true },
          });

          if (userRecord?.indexNumber) {
            viewer = {
              userId,
              indexNumber: userRecord.indexNumber,
            };
          }

          const userEntry = rankedLeaderboard.find((entry) => entry.id === userId);

          if (userEntry && userEntry.rank > TOP_LIMIT) {
            currentUser = {
              ...userEntry,
              indexNumber: userRecord?.indexNumber ?? "",
            };
          }
        }
      } catch {
        // Ignore invalid tokens and return public leaderboard data only.
      }
    }

    return NextResponse.json({
      success: true,
      data: topLeaderboard,
      currentUser,
      viewer,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Leaderboard error:", errorMessage, error);

    if (
      errorMessage.includes("connect") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Database connection failed. Please ensure your database is running.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
