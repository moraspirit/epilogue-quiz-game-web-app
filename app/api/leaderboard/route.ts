import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/jwt";

const TOP_LIMIT = 20;

type LeaderboardEntry = {
  id: number;
  name: string;
  indexNumber: string;
  level: number;
  score: number;
  status: "Playing" | "Completed" | "Idle";
  rank: number;
};

export async function GET(req: Request) {
  try {
    const users = await prisma.user.findMany({
      where: { role: "USER" },
      include: {
        progress: {
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
        },
      },
    });

    const rankedLeaderboard: LeaderboardEntry[] = users
      .map((user) => {
        const userProgress = user.progress[0];
        return {
          id: user.id,
          name: user.name,
          indexNumber: user.indexNumber ?? "",
          level: userProgress?.currentLevel || 1,
          score: userProgress?.totalScore || 0,
          status:
            (userProgress?.status as "Playing" | "Completed" | "Idle") ||
            "Idle",
          rank: 0,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.level - a.level;
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    const topLeaderboard = rankedLeaderboard.slice(0, TOP_LIMIT);

    let currentUser: LeaderboardEntry | null = null;
    const authHeader = req.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const payload = await verifyToken(token);
        const userId = Number(payload.id);

        if (!Number.isNaN(userId)) {
          const userEntry = rankedLeaderboard.find((entry) => entry.id === userId);

          if (userEntry && userEntry.rank > TOP_LIMIT) {
            currentUser = userEntry;
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
