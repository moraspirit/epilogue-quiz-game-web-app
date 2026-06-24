import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";
import {
  getAnswerWordLengths,
  getQuizLevelAccess,
} from "@/lib/quizProgress";

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
    const access = await getQuizLevelAccess(userId, uuid);

    if (!access.ok) {
      return NextResponse.json(access.body, { status: access.status });
    }

    const { level, currentQuestion, score } = access;

    if (level.questions.length === 0) {
      return NextResponse.json(
        { error: "This level has no questions configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      score,
      level: {
        id: level.id,
        uuid: level.uuid,
        title: level.title,
        levelOrder: level.levelOrder,
        totalQuestions: level.questions.length,
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
