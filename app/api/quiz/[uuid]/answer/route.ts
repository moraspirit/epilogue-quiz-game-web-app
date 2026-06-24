import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";
import {
  invalidateLeaderboardCache,
  invalidateUserProgressCache,
} from "@/lib/cache";
import { getQuizStructure } from "@/lib/quizStructure";
import {
  getCurrentQuestionFromSnapshot,
  hasCompletedPreviousLevelsFromSnapshot,
  isLevelFullyCompletedFromSnapshot,
  loadUserQuizSnapshot,
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

    const [structure, snapshot] = await Promise.all([
      getQuizStructure(),
      loadUserQuizSnapshot(userId),
    ]);

    const level = structure.levelByUuid.get(uuid);

    if (!level) {
      return NextResponse.json(
        { error: "Quiz level not found" },
        { status: 404 }
      );
    }

    if (!level.isActive) {
      return NextResponse.json(
        { error: "This quiz level is not active" },
        { status: 403 }
      );
    }

    const question = level.questions.find((item) => item.id === questionId);
    if (!question) {
      return NextResponse.json(
        { error: "Question not found in this level" },
        { status: 404 }
      );
    }

    if (
      !hasCompletedPreviousLevelsFromSnapshot(
        level.levelOrder,
        structure,
        snapshot.correctQuestionIds
      )
    ) {
      return NextResponse.json(
        { error: "You must complete previous levels first" },
        { status: 403 }
      );
    }

    if (snapshot.correctQuestionIds.has(question.id)) {
      return NextResponse.json(
        { error: "Question already answered" },
        { status: 400 }
      );
    }

    const currentQuestion = getCurrentQuestionFromSnapshot(
      level,
      snapshot.correctQuestionIds
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

    const updatedCorrectQuestionIds = new Set(snapshot.correctQuestionIds);
    updatedCorrectQuestionIds.add(question.id);
    const score = updatedCorrectQuestionIds.size;

    await invalidateUserProgressCache(userId);
    await invalidateLeaderboardCache();

    const nextQuestion = getCurrentQuestionFromSnapshot(
      level,
      updatedCorrectQuestionIds
    );
    const hasMoreQuestionsInLevel = nextQuestion !== null;
    const levelCompleted = isLevelFullyCompletedFromSnapshot(
      level,
      updatedCorrectQuestionIds
    );

    if (hasMoreQuestionsInLevel) {
      return NextResponse.json({
        success: true,
        correct: true,
        hasMoreQuestionsInLevel: true,
        levelCompleted: false,
        quizComplete: false,
        score,
      });
    }

    if (!levelCompleted) {
      return NextResponse.json({
        success: true,
        correct: true,
        hasMoreQuestionsInLevel: false,
        levelCompleted: false,
        quizComplete: false,
        score,
      });
    }

    const quizComplete = structure.levels.every((activeLevel) =>
      isLevelFullyCompletedFromSnapshot(activeLevel, updatedCorrectQuestionIds)
    );

    if (!quizComplete) {
      return NextResponse.json({
        success: true,
        correct: true,
        hasMoreQuestionsInLevel: false,
        levelCompleted: true,
        quizComplete: false,
        score,
      });
    }

    return NextResponse.json({
      success: true,
      correct: true,
      hasMoreQuestionsInLevel: false,
      levelCompleted: true,
      quizComplete: true,
      score,
      totalQuestions: structure.totalQuestions,
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
