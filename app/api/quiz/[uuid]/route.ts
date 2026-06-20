import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';

export async function GET(
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

    // Find the quiz level by UUID (each level = exactly one question)
    const quizLevel = await prisma.quizLevel.findUnique({
      where: { uuid },
      include: {
        questions: {
          orderBy: { questionOrder: 'asc' },
          take: 1,
          select: {
            id: true,
            questionText: true,
            questionOrder: true,
            // IMPORTANT: Don't send answerKey to client
          },
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

    // SECURITY CHECK: Verify user has completed all previous levels
    const previousLevels = await prisma.quizLevel.findMany({
      where: {
        levelOrder: {
          lt: quizLevel.levelOrder,
        },
        isActive: true,
      },
    });

    for (const prevLevel of previousLevels) {
      const completion = await prisma.userLevelCompletion.findFirst({
        where: {
          userId,
          quizLevelId: prevLevel.id,
        },
      });
      if (!completion) {
        return NextResponse.json(
          { error: 'You must complete previous levels first' },
          { status: 403 }
        );
      }
    }

    // Already completed THIS level? Don't re-serve the question -
    // one attempt only, right or wrong, no retries.
    const alreadyCompleted = await prisma.userLevelCompletion.findFirst({
      where: {
        userId,
        quizLevelId: quizLevel.id,
      },
    });

    if (alreadyCompleted) {
      // Tell the frontend this level is done so it can redirect forward
      // rather than show the question again.
      const progress = await prisma.userProgress.findFirst({
        where: { userId, questionId: question.id },
        select: { isCorrect: true },
      });

      return NextResponse.json(
        {
          error: 'Level already completed',
          alreadyCompleted: true,
          isCorrect: progress?.isCorrect ?? null,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      level: {
        id: quizLevel.id,
        uuid: quizLevel.uuid,
        title: quizLevel.title,
        levelOrder: quizLevel.levelOrder,
        question: {
          id: question.id,
          questionText: question.questionText,
          questionOrder: question.questionOrder,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching quiz level:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}