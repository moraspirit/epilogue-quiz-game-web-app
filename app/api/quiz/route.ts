import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/authServer";
import {
  resolvePlayerPattern,
  getCurrentQuizAccess,
} from "@/lib/quizProgress";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired session" },
        { status: 401 }
      );
    }

    const access = await getCurrentQuizAccess(user.id);

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
