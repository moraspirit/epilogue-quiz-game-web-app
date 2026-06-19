import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';

export async function POST(
  req: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    // Extract and verify JWT token
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch (err) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId as number;
    const uuid = params.uuid;
    const body = await req.json();
    const { questionId, answer } = body;

    if (!questionId || !answer) {
      return NextResponse.json(
        { error: 'Missing questionId or answer' },
        { status: 400 }
      );
    }

    // Find the quiz level
    const quizLevel = await prisma.quizLevel.findUnique({
      where: { uuid },
    });

    if (!quizLevel) {
      return NextResponse.json(
        { error: 'Quiz level not found' },
        { status: 404 }
      );
    }

    // Find the question
    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question || question.quizLevelId !== quizLevel.id) {
      return NextResponse.json(
        { error: 'Question not found or does not belong to this level' },
        { status: 404 }
      );
    }

    // Compare answer (case-insensitive, trimmed)
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedAnswerKey = question.answerKey.trim().toLowerCase();
    const isCorrect = normalizedAnswer === normalizedAnswerKey;

    if (!isCorrect) {
      return NextResponse.json({
        success: true,
        correct: false,
      });
    }

    // Answer is correct - record in user_progress
    await prisma.userProgress.create({
      data: {
        userId,
        questionId,
        passedAt: new Date(),
      },
    });

    // Check if all questions in this level are now passed
    const allQuestionsInLevel = await prisma.quizQuestion.findMany({
      where: { quizLevelId: quizLevel.id },
    });

    const allAnsweredCorrectly = (
      await Promise.all(
        allQuestionsInLevel.map((q) =>
          prisma.userProgress.findFirst({
            where: {
              userId,
              questionId: q.id,
            },
          })
        )
      )
    ).every((p) => p !== null);

    let levelComplete = false;
    if (allAnsweredCorrectly) {
      // Level is complete - record in user_level_completion
      await prisma.userLevelCompletion.create({
        data: {
          userId,
          quizLevelId: quizLevel.id,
          completedAt: new Date(),
        },
      });
      levelComplete = true;

      // Check if all levels are complete
      const allLevels = await prisma.quizLevel.findMany({
        where: { isActive: true },
      });

      const allLevelsCompleted = (
        await Promise.all(
          allLevels.map((l) =>
            prisma.userLevelCompletion.findFirst({
              where: {
                userId,
                quizLevelId: l.id,
              },
            })
          )
        )
      ).every((c) => c !== null);

      if (allLevelsCompleted) {
        // User is a winner!
        const winnerCount = await prisma.winner.count();
        await prisma.winner.create({
          data: {
            userId,
            finishedAt: new Date(),
            rank: winnerCount + 1,
          },
        });

        return NextResponse.json({
          success: true,
          correct: true,
          levelComplete: true,
          winner: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      correct: true,
      levelComplete,
      winner: false,
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
