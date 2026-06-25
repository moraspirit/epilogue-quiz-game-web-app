import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";
import {
  resolvePlayerPattern,
  getCurrentQuizAccess,
} from "@/lib/quizProgress";

export async function GET(req: NextRequest) {
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

    const access = await getCurrentQuizAccess(userId);

    if (!access.ok) {
      return NextResponse.json(access.body, { status: access.status });
    }

    const { currentQuestion, score, totalQuestions } = access;

    return NextResponse.json({
      success: true,
      score,
      totalQuestions,
      question: {
        id: currentQuestion.id,
        questionText: currentQuestion.questionText,
        questionOrder: currentQuestion.questionOrder,
        answerBlankPattern: resolvePlayerPattern(
          currentQuestion.answerKey,
          currentQuestion.answerPattern
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching quiz question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
