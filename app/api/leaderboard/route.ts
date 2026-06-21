import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all users with their latest progress
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      include: {
        progress: {
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: [
        {
          progress: {
            _count: "desc",
          },
        },
      ],
    });

    // Transform and sort the data for the leaderboard
    const leaderboard = users
      .map((user) => {
        const userProgress = user.progress[0];
        return {
          id: user.id,
          name: user.name,
          indexNumber: user.indexNumber ?? '',
          level: userProgress?.currentLevel || 1,
          score: userProgress?.totalScore || 0,
          status: (userProgress?.status as
            | "Playing"
            | "Completed"
            | "Idle") || "Idle",
        };
      })
      .sort((a, b) => {
        // Sort by score descending, then by level descending
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.level - a.level;
      });

    return NextResponse.json({
      success: true,
      data: leaderboard,
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
