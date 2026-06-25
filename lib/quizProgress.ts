import { prisma } from "@/lib/prisma";
import {
  getQuizStructure,
  type QuizQuestionData,
  type QuizStructure,
} from "@/lib/quizStructure";

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

export type AnswerBlankSegment =
  | { kind: "letters"; length: number }
  | { kind: "dash" }
  | { kind: "space" };

export function getAnswerBlankPattern(answerKey: string): AnswerBlankSegment[] {
  const segments: AnswerBlankSegment[] = [];
  const words = answerKey.trim().split(/\s+/).filter(Boolean);

  words.forEach((word, wordIndex) => {
    if (wordIndex > 0) {
      segments.push({ kind: "space" });
    }

    const parts = word.split("-");
    parts.forEach((part, partIndex) => {
      if (partIndex > 0) {
        segments.push({ kind: "dash" });
      }

      if (part.length > 0) {
        segments.push({ kind: "letters", length: part.length });
      }
    });
  });

  return segments;
}

/** @deprecated Use getAnswerBlankPattern instead */
export function getAnswerWordLengths(answerKey: string): number[] {
  return getAnswerBlankPattern(answerKey)
    .filter(
      (segment): segment is Extract<AnswerBlankSegment, { kind: "letters" }> =>
        segment.kind === "letters"
    )
    .map((segment) => segment.length);
}

export type UserQuizSnapshot = {
  structure: QuizStructure;
  correctQuestionIds: Set<number>;
};

export async function loadUserQuizSnapshot(
  userId: number
): Promise<UserQuizSnapshot> {
  const [structure, progressRecords] = await Promise.all([
    getQuizStructure(),
    prisma.userProgress.findMany({
      where: { userId, isCorrect: true },
      select: { questionId: true },
    }),
  ]);

  return {
    structure,
    correctQuestionIds: new Set(
      progressRecords.map((record) => record.questionId)
    ),
  };
}

export function computeQuizStatus(
  score: number,
  totalQuestions: number
): "Playing" | "Completed" | "Idle" {
  if (totalQuestions > 0 && score >= totalQuestions) {
    return "Completed";
  }

  if (score > 0) {
    return "Playing";
  }

  return "Idle";
}

export function getCurrentQuestionFromSnapshot(
  structure: QuizStructure,
  correctQuestionIds: Set<number>
): QuizQuestionData | null {
  return (
    structure.questions.find(
      (question) => !correctQuestionIds.has(question.id)
    ) ?? null
  );
}

export async function getUserQuizStats(userId: number) {
  const snapshot = await loadUserQuizSnapshot(userId);
  const score = snapshot.correctQuestionIds.size;

  return {
    score,
    status: computeQuizStatus(score, snapshot.structure.totalQuestions),
  };
}

export async function getNextPlayableQuiz(userId: number) {
  const snapshot = await loadUserQuizSnapshot(userId);
  const currentQuestion = getCurrentQuestionFromSnapshot(
    snapshot.structure,
    snapshot.correctQuestionIds
  );

  if (!currentQuestion) {
    return {
      done: true as const,
      score: snapshot.correctQuestionIds.size,
      totalQuestions: snapshot.structure.totalQuestions,
    };
  }

  return {
    done: false as const,
  };
}

export async function getCurrentQuizAccess(userId: number): Promise<
  | { ok: false; status: number; body: Record<string, unknown> }
  | {
      ok: true;
      currentQuestion: QuizQuestionData;
      score: number;
      totalQuestions: number;
    }
> {
  const snapshot = await loadUserQuizSnapshot(userId);

  if (snapshot.structure.totalQuestions === 0) {
    return {
      ok: false,
      status: 500,
      body: { error: "No quiz questions configured" },
    };
  }

  const currentQuestion = getCurrentQuestionFromSnapshot(
    snapshot.structure,
    snapshot.correctQuestionIds
  );

  if (!currentQuestion) {
    return {
      ok: false,
      status: 409,
      body: {
        error: "Quiz already completed",
        alreadyCompleted: true,
        isCorrect: true,
      },
    };
  }

  return {
    ok: true,
    currentQuestion,
    score: snapshot.correctQuestionIds.size,
    totalQuestions: snapshot.structure.totalQuestions,
  };
}
