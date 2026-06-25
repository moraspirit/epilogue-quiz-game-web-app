import { prisma } from "@/lib/prisma";
import { CACHE_TTL, cacheDelete, cacheGet, cacheSet } from "@/lib/cache";

export type QuizQuestionData = {
  id: number;
  questionText: string;
  questionOrder: number;
  answerKey: string;
};

export type QuizStructure = {
  questions: QuizQuestionData[];
  totalQuestions: number;
  questionById: Map<number, QuizQuestionData>;
};

const CACHE_KEY = "quiz:structure";
let memoryCache: { data: QuizStructure; expiresAt: number } | null = null;
const MEMORY_TTL_MS = CACHE_TTL.QUIZ_STRUCTURE * 1000;

function buildStructure(questions: QuizQuestionData[]): QuizStructure {
  return {
    questions,
    totalQuestions: questions.length,
    questionById: new Map(questions.map((question) => [question.id, question])),
  };
}

async function loadQuizStructureFromDb(): Promise<QuizStructure> {
  const questions = await prisma.quizQuestion.findMany({
    where: { isActive: true },
    orderBy: { questionOrder: "asc" },
    select: {
      id: true,
      questionText: true,
      questionOrder: true,
      answerKey: true,
    },
  });

  return buildStructure(questions);
}

export async function getQuizStructure(): Promise<QuizStructure> {
  if (memoryCache && memoryCache.expiresAt > Date.now()) {
    return memoryCache.data;
  }

  const cached = await cacheGet<{
    questions: QuizQuestionData[];
    totalQuestions: number;
  }>(CACHE_KEY);

  if (cached) {
    const structure = buildStructure(cached.questions);
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
      questions: structure.questions,
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
