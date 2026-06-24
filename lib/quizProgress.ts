import { prisma } from "@/lib/prisma";
import {
  getQuizStructure,
  type QuizLevelData,
  type QuizQuestionData,
  type QuizStructure,
} from "@/lib/quizStructure";

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

export type UserQuizSnapshot = {
  structure: QuizStructure;
  correctQuestionIds: Set<number>;
};

export async function loadUserQuizSnapshot(
  userId: number
): Promise<UserQuizSnapshot> {
  const [structure, progressRecords] = await Promise.all([
    getQuizStructure(),
    prisma.userProgress.findMany({
      where: { userId, isCorrect: true },
      select: { questionId: true },
    }),
  ]);

  return {
    structure,
    correctQuestionIds: new Set(
      progressRecords.map((record) => record.questionId)
    ),
  };
}

export function computeQuizStatus(
  score: number,
  totalQuestions: number
): "Playing" | "Completed" | "Idle" {
  if (totalQuestions > 0 && score >= totalQuestions) {
    return "Completed";
  }

  if (score > 0) {
    return "Playing";
  }

  return "Idle";
}

export function isLevelFullyCompletedFromSnapshot(
  level: QuizLevelData,
  correctQuestionIds: Set<number>
): boolean {
  return (
    level.questionIds.length > 0 &&
    level.questionIds.every((questionId) => correctQuestionIds.has(questionId))
  );
}

export function hasCompletedPreviousLevelsFromSnapshot(
  levelOrder: number,
  structure: QuizStructure,
  correctQuestionIds: Set<number>
): boolean {
  for (const level of structure.levels) {
    if (level.levelOrder >= levelOrder) {
      break;
    }

    if (!isLevelFullyCompletedFromSnapshot(level, correctQuestionIds)) {
      return false;
    }
  }

  return true;
}

export function getCurrentQuestionFromSnapshot(
  level: QuizLevelData,
  correctQuestionIds: Set<number>
): QuizQuestionData | null {
  return level.questions.find((question) => !correctQuestionIds.has(question.id)) ?? null;
}

export async function getActiveLevels() {
  const structure = await getQuizStructure();
  return structure.levels.map(({ questionIds, questions, ...level }) => level);
}

export async function getLevelQuestions(quizLevelId: number) {
  const structure = await getQuizStructure();
  return structure.levelById.get(quizLevelId)?.questions ?? [];
}

export async function isLevelFullyCompleted(
  userId: number,
  quizLevelId: number
): Promise<boolean> {
  const snapshot = await loadUserQuizSnapshot(userId);
  const level = snapshot.structure.levelById.get(quizLevelId);

  if (!level) {
    return false;
  }

  return isLevelFullyCompletedFromSnapshot(level, snapshot.correctQuestionIds);
}

export async function getCurrentQuestionForLevel(
  userId: number,
  quizLevelId: number
) {
  const snapshot = await loadUserQuizSnapshot(userId);
  const level = snapshot.structure.levelById.get(quizLevelId);

  if (!level) {
    return null;
  }

  return getCurrentQuestionFromSnapshot(level, snapshot.correctQuestionIds);
}

export async function hasCompletedPreviousLevels(
  userId: number,
  levelOrder: number
): Promise<boolean> {
  const snapshot = await loadUserQuizSnapshot(userId);
  return hasCompletedPreviousLevelsFromSnapshot(
    levelOrder,
    snapshot.structure,
    snapshot.correctQuestionIds
  );
}

export async function getUserLevelStatus(userId: number) {
  const snapshot = await loadUserQuizSnapshot(userId);

  return snapshot.structure.levels.map((level) => {
    const isCompleted = isLevelFullyCompletedFromSnapshot(
      level,
      snapshot.correctQuestionIds
    );
    const previousCompleted = hasCompletedPreviousLevelsFromSnapshot(
      level.levelOrder,
      snapshot.structure,
      snapshot.correctQuestionIds
    );

    let status: "locked" | "available" | "completed" = "locked";

    if (isCompleted) {
      status = "completed";
    } else if (previousCompleted) {
      status = "available";
    }

    return {
      id: level.id,
      uuid: level.uuid,
      title: level.title,
      levelOrder: level.levelOrder,
      isActive: level.isActive,
      status,
      isUnlocked: previousCompleted,
    };
  });
}

export async function markLevelCompletedIfReadyFromSnapshot(
  userId: number,
  level: QuizLevelData,
  correctQuestionIds: Set<number>
) {
  if (!isLevelFullyCompletedFromSnapshot(level, correctQuestionIds)) {
    return false;
  }

  await prisma.userLevelCompletion.upsert({
    where: {
      userId_quizLevelId: {
        userId,
        quizLevelId: level.id,
      },
    },
    update: {
      completedAt: new Date(),
    },
    create: {
      userId,
      quizLevelId: level.id,
      completedAt: new Date(),
    },
  });

  return true;
}

export async function markLevelCompletedIfReady(
  userId: number,
  quizLevelId: number
) {
  const snapshot = await loadUserQuizSnapshot(userId);
  const level = snapshot.structure.levelById.get(quizLevelId);

  if (!level) {
    return false;
  }

  return markLevelCompletedIfReadyFromSnapshot(
    userId,
    level,
    snapshot.correctQuestionIds
  );
}

export async function getQuizScoreSummary(userId: number) {
  const snapshot = await loadUserQuizSnapshot(userId);

  return {
    correctCount: snapshot.correctQuestionIds.size,
    totalQuestions: snapshot.structure.totalQuestions,
  };
}

export async function getUserQuizStats(userId: number) {
  const snapshot = await loadUserQuizSnapshot(userId);
  const score = snapshot.correctQuestionIds.size;

  return {
    score,
    status: computeQuizStatus(score, snapshot.structure.totalQuestions),
  };
}

export async function syncUserProgressStats(
  userId: number,
  questionId: number,
  stats?: { score: number; status: "Playing" | "Completed" | "Idle" }
) {
  const resolvedStats = stats ?? (await getUserQuizStats(userId));

  await prisma.userProgress.update({
    where: {
      userId_questionId: {
        userId,
        questionId,
      },
    },
    data: {
      totalScore: resolvedStats.score,
      status: resolvedStats.status,
    },
  });

  return resolvedStats;
}

export async function getNextPlayableLevel(userId: number) {
  const snapshot = await loadUserQuizSnapshot(userId);

  for (const level of snapshot.structure.levels) {
    if (
      isLevelFullyCompletedFromSnapshot(level, snapshot.correctQuestionIds)
    ) {
      continue;
    }

    if (
      !hasCompletedPreviousLevelsFromSnapshot(
        level.levelOrder,
        snapshot.structure,
        snapshot.correctQuestionIds
      )
    ) {
      continue;
    }

    return {
      done: false as const,
      nextLevelUuid: level.uuid,
      nextLevelOrder: level.levelOrder,
    };
  }

  return {
    done: true as const,
    score: snapshot.correctQuestionIds.size,
    totalQuestions: snapshot.structure.totalQuestions,
  };
}

export async function getQuizLevelAccess(
  userId: number,
  uuid: string
): Promise<
  | { ok: false; status: number; body: Record<string, unknown> }
  | {
      ok: true;
      level: QuizLevelData;
      currentQuestion: QuizQuestionData;
      score: number;
    }
> {
  const snapshot = await loadUserQuizSnapshot(userId);
  const level = snapshot.structure.levelByUuid.get(uuid);

  if (!level) {
    return {
      ok: false,
      status: 404,
      body: { error: "Quiz level not found" },
    };
  }

  if (!hasCompletedPreviousLevelsFromSnapshot(
    level.levelOrder,
    snapshot.structure,
    snapshot.correctQuestionIds
  )) {
    return {
      ok: false,
      status: 403,
      body: { error: "You must complete previous levels first" },
    };
  }

  if (
    isLevelFullyCompletedFromSnapshot(level, snapshot.correctQuestionIds)
  ) {
    return {
      ok: false,
      status: 409,
      body: {
        error: "Level already completed",
        alreadyCompleted: true,
        isCorrect: true,
      },
    };
  }

  const currentQuestion = getCurrentQuestionFromSnapshot(
    level,
    snapshot.correctQuestionIds
  );

  if (!currentQuestion) {
    return {
      ok: false,
      status: 409,
      body: {
        error: "Level already completed",
        alreadyCompleted: true,
        isCorrect: true,
      },
    };
  }

  return {
    ok: true,
    level,
    currentQuestion,
    score: snapshot.correctQuestionIds.size,
  };
}
