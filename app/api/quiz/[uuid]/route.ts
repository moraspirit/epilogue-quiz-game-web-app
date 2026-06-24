import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";
import {
  CACHE_TTL,
  cacheGet,
  cacheSet,
} from "@/lib/cache";
import {
  getAnswerWordLengths,
  getCurrentQuestionForLevel,
  getLevelQuestions,
  hasCompletedPreviousLevels,
  isLevelFullyCompleted,
} from "@/lib/quizProgress";

type CachedQuizLevel = {
  id: number;
  uuid: string;
  title: string;
  levelOrder: number;
  isActive: boolean;
};

async function getQuizLevelByUuid(uuid: string): Promise<CachedQuizLevel | null> {
  const cacheKey = `quiz:level:${uuid}`;
  const cached = await cacheGet<CachedQuizLevel>(cacheKey);

  if (cached) {
    return cached;
  }

  const quizLevel = await prisma.quizLevel.findUnique({
    where: { uuid },
    select: {
      id: true,
      uuid: true,
      title: true,
      levelOrder: true,
      isActive: true,
    },
  });

  if (quizLevel) {
    await cacheSet(cacheKey, quizLevel, CACHE_TTL.QUIZ_LEVEL);
  }

  return quizLevel;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
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

    const { uuid } = await params;
    const quizLevel = await getQuizLevelByUuid(uuid);

    if (!quizLevel) {
      return NextResponse.json(
        { error: "Quiz level not found" },
        { status: 404 }
      );
    }

    if (!quizLevel.isActive) {
      return NextResponse.json(
        { error: "This quiz level is not active" },
        { status: 403 }
      );
    }

    const previousCompleted = await hasCompletedPreviousLevels(
      userId,
      quizLevel.levelOrder
    );

    if (!previousCompleted) {
      return NextResponse.json(
        { error: "You must complete previous levels first" },
        { status: 403 }
      );
    }

    const questions = await getLevelQuestions(quizLevel.id);
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "This level has no questions configured" },
        { status: 500 }
      );
    }

    if (await isLevelFullyCompleted(userId, quizLevel.id)) {
      return NextResponse.json(
        {
          error: "Level already completed",
          alreadyCompleted: true,
          isCorrect: true,
        },
        { status: 409 }
      );
    }

    const currentQuestion = await getCurrentQuestionForLevel(
      userId,
      quizLevel.id
    );

    if (!currentQuestion) {
      return NextResponse.json(
        {
          error: "Level already completed",
          alreadyCompleted: true,
          isCorrect: true,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      level: {
        id: quizLevel.id,
        uuid: quizLevel.uuid,
        title: quizLevel.title,
        levelOrder: quizLevel.levelOrder,
        totalQuestions: questions.length,
        question: {
          id: currentQuestion.id,
          questionText: currentQuestion.questionText,
          questionOrder: currentQuestion.questionOrder,
        },
        answerWordLengths: getAnswerWordLengths(currentQuestion.answerKey),
      },
    });
  } catch (error) {
    console.error("Error fetching quiz level:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
