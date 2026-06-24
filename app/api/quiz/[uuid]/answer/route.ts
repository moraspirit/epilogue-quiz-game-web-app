import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";
import {
  invalidateLeaderboardCache,
  invalidateUserProgressCache,
} from "@/lib/cache";
import {
  getCurrentQuestionForLevel,
  getActiveLevels,
  getQuizScoreSummary,
  hasCompletedPreviousLevels,
  isLevelFullyCompleted,
  markLevelCompletedIfReady,
  normalizeAnswer,
} from "@/lib/quizProgress";

export async function POST(
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
    const body = await req.json();
    const { answer, questionId } = body;

    if (typeof answer !== "string" || answer.trim() === "") {
      return NextResponse.json(
        { error: "Missing or invalid answer" },
        { status: 400 }
      );
    }

    if (typeof questionId !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid questionId" },
        { status: 400 }
      );
    }

    const quizLevel = await prisma.quizLevel.findUnique({
      where: { uuid },
      include: {
        questions: {
          orderBy: { questionOrder: "asc" },
        },
      },
    });

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

    const question = quizLevel.questions.find((item) => item.id === questionId);
    if (!question) {
      return NextResponse.json(
        { error: "Question not found in this level" },
        { status: 404 }
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

    const existingProgress = await prisma.userProgress.findFirst({
      where: {
        userId,
        questionId: question.id,
        isCorrect: true,
      },
    });

    if (existingProgress) {
      return NextResponse.json(
        { error: "Question already answered" },
        { status: 400 }
      );
    }

    const currentQuestion = await getCurrentQuestionForLevel(
      userId,
      quizLevel.id
    );

    if (!currentQuestion || currentQuestion.id !== question.id) {
      return NextResponse.json(
        { error: "You must answer the current question in order" },
        { status: 403 }
      );
    }

    const isCorrect =
      normalizeAnswer(answer) === normalizeAnswer(question.answerKey);

    if (!isCorrect) {
      return NextResponse.json({
        success: true,
        correct: false,
      });
    }

    await prisma.userProgress.upsert({
      where: {
        userId_questionId: {
          userId,
          questionId: question.id,
        },
      },
      update: {
        isCorrect: true,
        passedAt: new Date(),
      },
      create: {
        userId,
        questionId: question.id,
        passedAt: new Date(),
        isCorrect: true,
      },
    });

    await invalidateUserProgressCache(userId);
    await invalidateLeaderboardCache();

    const levelCompleted = await markLevelCompletedIfReady(
      userId,
      quizLevel.id
    );
    const nextQuestion = await getCurrentQuestionForLevel(userId, quizLevel.id);
    const hasMoreQuestionsInLevel = nextQuestion !== null;

    if (hasMoreQuestionsInLevel) {
      return NextResponse.json({
        success: true,
        correct: true,
        blocked: false,
        hasMoreQuestionsInLevel: true,
        levelCompleted: false,
        quizComplete: false,
      });
    }

    if (!levelCompleted) {
      return NextResponse.json({
        success: true,
        correct: true,
        blocked: false,
        hasMoreQuestionsInLevel: false,
        levelCompleted: false,
        quizComplete: false,
      });
    }

    const allLevels = await getActiveLevels();
    let quizComplete = true;

    for (const level of allLevels) {
      if (!(await isLevelFullyCompleted(userId, level.id))) {
        quizComplete = false;
        break;
      }
    }

    if (!quizComplete) {
      return NextResponse.json({
        success: true,
        correct: true,
        blocked: false,
        hasMoreQuestionsInLevel: false,
        levelCompleted: true,
        quizComplete: false,
      });
    }

    const { correctCount, totalQuestions } = await getQuizScoreSummary(userId);

    return NextResponse.json({
      success: true,
      correct: true,
      blocked: false,
      hasMoreQuestionsInLevel: false,
      levelCompleted: true,
      quizComplete: true,
      score: correctCount,
      totalQuestions,
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
