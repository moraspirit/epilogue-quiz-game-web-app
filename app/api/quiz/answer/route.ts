import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";
import {
  invalidateLeaderboardCache,
  invalidateUserProgressCache,
} from "@/lib/cache";
import {
  getCurrentQuestionFromSnapshot,
  loadUserQuizSnapshot,
  normalizeAnswer,
} from "@/lib/quizProgress";

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get("authorization"));

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

    const snapshot = await loadUserQuizSnapshot(userId);
    const question = snapshot.structure.questionById.get(questionId);

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    if (snapshot.correctQuestionIds.has(question.id)) {
      return NextResponse.json(
        { error: "Question already answered" },
        { status: 400 }
      );
    }

    const currentQuestion = getCurrentQuestionFromSnapshot(
      snapshot.structure,
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

    const score = snapshot.correctQuestionIds.size + 1;
    const totalQuestions = snapshot.structure.totalQuestions;
    const quizComplete = score >= totalQuestions;

    await invalidateUserProgressCache(userId);
    await invalidateLeaderboardCache();

    return NextResponse.json({
      success: true,
      correct: true,
      quizComplete,
      score,
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
