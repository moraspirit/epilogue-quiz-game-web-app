import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/authServer";
import {
  CACHE_TTL,
  cacheGet,
  cacheSet,
} from "@/lib/cache";
import { getQuizStructure } from "@/lib/quizStructure";
import { loadUserQuizSnapshot } from "@/lib/quizProgress";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = user.id;

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
