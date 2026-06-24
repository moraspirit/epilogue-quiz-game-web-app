import { prisma } from "@/lib/prisma";
import { CACHE_TTL, cacheDelete, cacheGet, cacheSet } from "@/lib/cache";

export type QuizQuestionData = {
  id: number;
  questionText: string;
  questionOrder: number;
  answerKey: string;
};

export type QuizLevelData = {
  id: number;
  uuid: string;
  title: string;
  levelOrder: number;
  isActive: boolean;
  questionIds: number[];
  questions: QuizQuestionData[];
};

export type QuizStructure = {
  levels: QuizLevelData[];
  totalQuestions: number;
  levelByUuid: Map<string, QuizLevelData>;
  levelById: Map<number, QuizLevelData>;
};

const CACHE_KEY = "quiz:structure";
let memoryCache: { data: QuizStructure; expiresAt: number } | null = null;
const MEMORY_TTL_MS = CACHE_TTL.QUIZ_STRUCTURE * 1000;

function buildStructure(
  levels: Array<{
    id: number;
    uuid: string;
    title: string;
    levelOrder: number;
    isActive: boolean;
    questions: QuizQuestionData[];
  }>
): QuizStructure {
  const levelData: QuizLevelData[] = levels.map((level) => ({
    id: level.id,
    uuid: level.uuid,
    title: level.title,
    levelOrder: level.levelOrder,
    isActive: level.isActive,
    questions: level.questions,
    questionIds: level.questions.map((question) => question.id),
  }));

  let totalQuestions = 0;
  for (const level of levelData) {
    totalQuestions += level.questionIds.length;
  }

  return {
    levels: levelData,
    totalQuestions,
    levelByUuid: new Map(levelData.map((level) => [level.uuid, level])),
    levelById: new Map(levelData.map((level) => [level.id, level])),
  };
}

async function loadQuizStructureFromDb(): Promise<QuizStructure> {
  const levels = await prisma.quizLevel.findMany({
    where: { isActive: true },
    orderBy: { levelOrder: "asc" },
    select: {
      id: true,
      uuid: true,
      title: true,
      levelOrder: true,
      isActive: true,
      questions: {
        orderBy: { questionOrder: "asc" },
        select: {
          id: true,
          questionText: true,
          questionOrder: true,
          answerKey: true,
        },
      },
    },
  });

  return buildStructure(levels);
}

export async function getQuizStructure(): Promise<QuizStructure> {
  if (memoryCache && memoryCache.expiresAt > Date.now()) {
    return memoryCache.data;
  }

  const cached = await cacheGet<{
    levels: QuizLevelData[];
    totalQuestions: number;
  }>(CACHE_KEY);

  if (cached) {
    const structure = buildStructure(cached.levels);
    memoryCache = {
      data: structure,
      expiresAt: Date.now() + MEMORY_TTL_MS,
    };
    return structure;
  }

  const structure = await loadQuizStructureFromDb();
  memoryCache = {
    data: structure,
    expiresAt: Date.now() + MEMORY_TTL_MS,
  };

  await cacheSet(
    CACHE_KEY,
    {
      levels: structure.levels,
      totalQuestions: structure.totalQuestions,
    },
    CACHE_TTL.QUIZ_STRUCTURE
  );

  return structure;
}

export async function invalidateQuizStructureCache(): Promise<void> {
  memoryCache = null;
  await cacheDelete(CACHE_KEY);
}
