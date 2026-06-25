import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";
import {
  CACHE_TTL,
  cacheGet,
  cacheSet,
} from "@/lib/cache";
import { getQuizStructure } from "@/lib/quizStructure";
import { loadUserQuizSnapshot } from "@/lib/quizProgress";

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

    const cacheKey = `user:progress:${userId}`;
    let questionStatus = await cacheGet<
      Array<{ id: number; questionOrder: number; status: "completed" | "current" | "locked" }>
    >(cacheKey);

    if (!questionStatus) {
      const snapshot = await loadUserQuizSnapshot(userId);
      const currentQuestionId = snapshot.structure.questions.find(
        (question) => !snapshot.correctQuestionIds.has(question.id)
      )?.id;

      questionStatus = snapshot.structure.questions.map((question) => {
        let status: "completed" | "current" | "locked" = "locked";

        if (snapshot.correctQuestionIds.has(question.id)) {
          status = "completed";
        } else if (question.id === currentQuestionId) {
          status = "current";
        }

        return {
          id: question.id,
          questionOrder: question.questionOrder,
          status,
        };
      });

      await cacheSet(cacheKey, questionStatus, CACHE_TTL.USER_PROGRESS);
    }

    const structure = await getQuizStructure();

    return NextResponse.json({
      success: true,
      totalQuestions: structure.totalQuestions,
      questions: questionStatus,
    });
  } catch (error) {
    console.error("Error fetching quiz progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
