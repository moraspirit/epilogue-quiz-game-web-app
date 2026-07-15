import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/authServer";
import {
  CACHE_TTL,
  cacheGet,
  cacheSet,
} from "@/lib/cache";
import { computeQuizStatus } from "@/lib/quizProgress";
import { getQuizStructure } from "@/lib/quizStructure";

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
  const [users, structure, correctCounts] = await Promise.all([
    prisma.user.findMany({
      where: { role: "USER" },
      include: {
        progress: {
          orderBy: { passedAt: "desc" },
          take: 1,
        },
      },
    }),
    getQuizStructure(),
    prisma.userProgress.groupBy({
      by: ["userId"],
      where: { isCorrect: true },
      _count: { questionId: true },
    }),
  ]);

  const scoreByUserId = new Map(
    correctCounts.map((entry) => [entry.userId, entry._count.questionId])
  );

  const entries = users.map((user) => {
    const score = scoreByUserId.get(user.id) ?? 0;
    const lastCompletedAt = user.progress[0]?.passedAt ?? null;

    return {
      id: user.id,
      name: user.name,
      score,
      status: computeQuizStatus(score, structure.totalQuestions),
      lastCompletedAt,
      rank: 0,
    };
  });

  return entries
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const timeA = a.lastCompletedAt ? new Date(a.lastCompletedAt).getTime() : Infinity;
      const timeB = b.lastCompletedAt ? new Date(b.lastCompletedAt).getTime() : Infinity;
      return timeA - timeB;
    })
    .map((entry, index) => ({
      id: entry.id,
      name: entry.name,
      score: entry.score,
      status: entry.status,
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
    const viewerUser = await getAuthenticatedUser(req);

    if (viewerUser) {
      const userRecord = await prisma.user.findUnique({
        where: { id: viewerUser.id },
        select: { indexNumber: true },
      });

      if (userRecord?.indexNumber) {
        viewer = {
          userId: viewerUser.id,
          indexNumber: userRecord.indexNumber,
        };
      }

      const userEntry = rankedLeaderboard.find(
        (entry) => entry.id === viewerUser.id
      );

      if (userEntry && userEntry.rank > TOP_LIMIT) {
        currentUser = {
          ...userEntry,
          indexNumber: userRecord?.indexNumber ?? "",
        };
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
