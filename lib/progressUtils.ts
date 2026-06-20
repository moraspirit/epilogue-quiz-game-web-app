import { prisma } from "@/lib/prisma";

export interface UpdateProgressParams {
  userId: number;
  questionId: number;
  currentLevel: number;
  totalScore: number;
  status?: "Playing" | "Completed" | "Idle";
}

/**
 * Update user progress in the quiz
 */
export async function updateUserProgress(
  params: UpdateProgressParams
) {
  const {
    userId,
    questionId,
    currentLevel,
    totalScore,
    status = "Playing",
  } = params;

  try {
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
      update: {
        currentLevel,
        totalScore,
        status,
        updatedAt: new Date(),
      },
      create: {
        userId,
        questionId,
        passedAt: new Date(),
        currentLevel,
        totalScore,
        status,
      },
    });

    return {
      success: true,
      data: progress,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating user progress:", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get user's current progress
 */
export async function getUserProgress(userId: number) {
  try {
    const progress = await prisma.userProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 1,
    });

    const userProgress = progress[0];

    return {
      success: true,
      data: {
        currentLevel: userProgress?.currentLevel || 1,
        totalScore: userProgress?.totalScore || 0,
        status: userProgress?.status || "Idle",
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching user progress:", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Complete a level for a user
 */
export async function completeLevelForUser(
  userId: number,
  quizLevelId: number
) {
  try {
    const levelCompletion =
      await prisma.userLevelCompletion.upsert({
        where: {
          userId_quizLevelId: {
            userId,
            quizLevelId,
          },
        },
        update: {
          completedAt: new Date(),
        },
        create: {
          userId,
          quizLevelId,
          completedAt: new Date(),
        },
      });

    // Update user as winner if they completed all levels
    const allLevels = await prisma.quizLevel.findMany();
    const completedLevels =
      await prisma.userLevelCompletion.findMany({
        where: { userId },
      });

    if (completedLevels.length === allLevels.length) {
      const winnersCount = await prisma.winner.count();

      await prisma.winner.create({
        data: {
          userId,
          finishedAt: new Date(),
          rank: winnersCount + 1,
        },
      });
    }

    return {
      success: true,
      data: levelCompletion,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error completing level:", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
