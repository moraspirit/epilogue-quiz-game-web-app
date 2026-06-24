import { prisma } from "@/lib/db";

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

export function getAnswerWordLengths(answerKey: string): number[] {
  return answerKey
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.length);
}

export async function getActiveLevels() {
  return prisma.quizLevel.findMany({
    where: { isActive: true },
    orderBy: { levelOrder: "asc" },
    select: {
      id: true,
      uuid: true,
      title: true,
      levelOrder: true,
      isActive: true,
    },
  });
}

export async function getLevelQuestions(quizLevelId: number) {
  return prisma.quizQuestion.findMany({
    where: { quizLevelId },
    orderBy: { questionOrder: "asc" },
  });
}

export async function getPreviousActiveLevels(levelOrder: number) {
  return prisma.quizLevel.findMany({
    where: {
      levelOrder: { lt: levelOrder },
      isActive: true,
    },
    orderBy: { levelOrder: "asc" },
  });
}

export async function isLevelFullyCompleted(
  userId: number,
  quizLevelId: number
): Promise<boolean> {
  const questions = await getLevelQuestions(quizLevelId);

  if (questions.length === 0) {
    return false;
  }

  const correctCount = await prisma.userProgress.count({
    where: {
      userId,
      questionId: { in: questions.map((question) => question.id) },
      isCorrect: true,
    },
  });

  return correctCount === questions.length;
}

export async function getCurrentQuestionForLevel(
  userId: number,
  quizLevelId: number
) {
  const questions = await getLevelQuestions(quizLevelId);

  for (const question of questions) {
    const correctProgress = await prisma.userProgress.findFirst({
      where: {
        userId,
        questionId: question.id,
        isCorrect: true,
      },
    });

    if (!correctProgress) {
      return question;
    }
  }

  return null;
}

export async function hasCompletedPreviousLevels(
  userId: number,
  levelOrder: number
): Promise<boolean> {
  const previousLevels = await getPreviousActiveLevels(levelOrder);

  for (const previousLevel of previousLevels) {
    const completed = await isLevelFullyCompleted(userId, previousLevel.id);
    if (!completed) {
      return false;
    }
  }

  return true;
}

export async function getUserLevelStatus(userId: number) {
  const levels = await getActiveLevels();
  const levelIds = levels.map((level) => level.id);

  const [questions, progressRecords] = await Promise.all([
    prisma.quizQuestion.findMany({
      where: { quizLevelId: { in: levelIds } },
      select: { id: true, quizLevelId: true },
    }),
    prisma.userProgress.findMany({
      where: { userId, isCorrect: true },
      select: { questionId: true },
    }),
  ]);

  const questionsByLevel = new Map<number, number[]>();
  for (const question of questions) {
    const existing = questionsByLevel.get(question.quizLevelId) ?? [];
    existing.push(question.id);
    questionsByLevel.set(question.quizLevelId, existing);
  }

  const completedQuestionIds = new Set(
    progressRecords.map((record) => record.questionId)
  );

  return levels.map((level) => {
    const questionIds = questionsByLevel.get(level.id) ?? [];
    const correctCount = questionIds.filter((questionId) =>
      completedQuestionIds.has(questionId)
    ).length;
    const isCompleted =
      questionIds.length > 0 && correctCount === questionIds.length;

    let previousCompleted = true;
    for (const previousLevel of levels) {
      if (previousLevel.levelOrder >= level.levelOrder) {
        break;
      }

      const previousQuestionIds = questionsByLevel.get(previousLevel.id) ?? [];
      const previousCorrectCount = previousQuestionIds.filter((questionId) =>
        completedQuestionIds.has(questionId)
      ).length;

      if (
        previousQuestionIds.length === 0 ||
        previousCorrectCount !== previousQuestionIds.length
      ) {
        previousCompleted = false;
        break;
      }
    }

    let status: "locked" | "available" | "completed" = "locked";

    if (isCompleted) {
      status = "completed";
    } else if (previousCompleted) {
      status = "available";
    }

    return {
      ...level,
      status,
      isUnlocked: previousCompleted,
    };
  });
}

export async function markLevelCompletedIfReady(
  userId: number,
  quizLevelId: number
) {
  const fullyCompleted = await isLevelFullyCompleted(userId, quizLevelId);

  if (!fullyCompleted) {
    return false;
  }

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

  return true;
}

export async function getQuizScoreSummary(userId: number) {
  const levels = await getActiveLevels();
  let totalQuestions = 0;

  for (const level of levels) {
    const questions = await getLevelQuestions(level.id);
    totalQuestions += questions.length;
  }

  const correctCount = await prisma.userProgress.count({
    where: { userId, isCorrect: true },
  });

  return { correctCount, totalQuestions };
}

export async function getNextPlayableLevel(userId: number) {
  const levels = await getActiveLevels();

  for (const level of levels) {
    const fullyCompleted = await isLevelFullyCompleted(userId, level.id);
    if (!fullyCompleted) {
      const previousCompleted = await hasCompletedPreviousLevels(
        userId,
        level.levelOrder
      );

      if (!previousCompleted) {
        continue;
      }

      return {
        done: false as const,
        nextLevelUuid: level.uuid,
        nextLevelOrder: level.levelOrder,
      };
    }
  }

  const { correctCount, totalQuestions } = await getQuizScoreSummary(userId);

  return {
    done: true as const,
    score: correctCount,
    totalQuestions,
  };
}
