import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
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

    const userId = payload.id as number;
    const { uuid } = await params;
    const body = await req.json();
    const { answer } = body;

    if (typeof answer !== 'string' || answer.trim() === '') {
      return NextResponse.json(
        { error: 'Missing or invalid answer' },
        { status: 400 }
      );
    }

    // Find the quiz level (each level = exactly one question)
    const quizLevel = await prisma.quizLevel.findUnique({
      where: { uuid },
      include: {
        questions: {
          orderBy: { questionOrder: 'asc' },
          take: 1,
        },
      },
    });

    if (!quizLevel) {
      return NextResponse.json(
        { error: 'Quiz level not found' },
        { status: 404 }
      );
    }

    if (!quizLevel.isActive) {
      return NextResponse.json(
        { error: 'This quiz level is not active' },
        { status: 403 }
      );
    }

    const question = quizLevel.questions[0];
    if (!question) {
      return NextResponse.json(
        { error: 'This level has no question configured' },
        { status: 500 }
      );
    }

    // SECURITY CHECK: previous levels must be completed first
    const previousLevels = await prisma.quizLevel.findMany({
      where: {
        levelOrder: { lt: quizLevel.levelOrder },
        isActive: true,
      },
    });

    for (const prevLevel of previousLevels) {
      const completion = await prisma.userLevelCompletion.findFirst({
        where: { userId, quizLevelId: prevLevel.id },
      });
      if (!completion) {
        return NextResponse.json(
          { error: 'You must complete previous levels first' },
          { status: 403 }
        );
      }
    }

    // ONE ATTEMPT ONLY: if this question has already been answered
    // (right or wrong) by this user, refuse - no retries.
    const existingProgress = await prisma.userProgress.findFirst({
      where: { userId, questionId: question.id },
    });

    if (existingProgress) {
      return NextResponse.json(
        { error: 'Question already answered' },
        { status: 400 }
      );
    }

    // Compare answer (case-insensitive, trimmed)
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedAnswerKey = question.answerKey.trim().toLowerCase();
    const isCorrect = normalizedAnswer === normalizedAnswerKey;

    const now = new Date();

    // Record the attempt AND mark the level complete together - since
    // each level is exactly one question, attempting the question
    // immediately completes the level (correct or not).
    await prisma.$transaction([
      prisma.userProgress.create({
        data: {
          userId,
          questionId: question.id,
          passedAt: now,
          isCorrect,
        },
      }),
      prisma.userLevelCompletion.create({
        data: {
          userId,
          quizLevelId: quizLevel.id,
          completedAt: now,
        },
      }),
    ]);

    // Check if this was the last active level - if so, compute final score
    const allLevels = await prisma.quizLevel.findMany({
      where: { isActive: true },
    });

    const allLevelsCompleted = (
      await Promise.all(
        allLevels.map((l) =>
          prisma.userLevelCompletion.findFirst({
            where: { userId, quizLevelId: l.id },
          })
        )
      )
    ).every((c) => c !== null);

    if (!allLevelsCompleted) {
      return NextResponse.json({
        success: true,
        correct: isCorrect,
        quizComplete: false,
      });
    }

    // All levels completed - calculate and return the final score.
    // NOTE: We deliberately do NOT write to the `winners` table here.
    // Winner is not decided live/first-to-finish - quiz takers play
    // asynchronously at different times, so "winner" can only be
    // determined later by an admin comparing everyone's completion
    // time/score after the competition window closes.
    const correctCount = await prisma.userProgress.count({
      where: { userId, isCorrect: true },
    });

    return NextResponse.json({
      success: true,
      correct: isCorrect,
      quizComplete: true,
      score: correctCount,
      totalQuestions: allLevels.length,
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}