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

    const userId = payload.userId as number;
    const { uuid } = await params;

    // Find the quiz level by UUID
    const quizLevel = await prisma.quizLevel.findUnique({
      where: { uuid },
      include: {
        questions: {
          orderBy: { questionOrder: 'asc' },
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

    // SECURITY CHECK: Verify user has completed all previous levels
    const previousLevels = await prisma.quizLevel.findMany({
      where: {
        levelOrder: {
          lt: quizLevel.levelOrder, // Less than current level
        },
        isActive: true,
      },
    });

    // Check if user has completed all previous levels
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

    // Return the level with questions (without answer keys)
    return NextResponse.json({
      success: true,
      level: {
        id: quizLevel.id,
        uuid: quizLevel.uuid,
        title: quizLevel.title,
        levelOrder: quizLevel.levelOrder,
        questions: quizLevel.questions,
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
