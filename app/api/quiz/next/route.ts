import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';

// GET /api/quiz/next
//
// Returns the uuid of the lowest-level_order level this user has NOT yet
// completed. If every level is completed, returns the final score instead.
// Call this after login, and after submitting an answer (when the quiz
// is not yet complete) to find out where to send the user next.
export async function GET(req: NextRequest) {
  try {
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

    const allLevels = await prisma.quizLevel.findMany({
      where: { isActive: true },
      orderBy: { levelOrder: 'asc' },
      select: { id: true, uuid: true, levelOrder: true },
    });

    if (allLevels.length === 0) {
      return NextResponse.json(
        { error: 'No quiz levels configured' },
        { status: 500 }
      );
    }

    const completions = await prisma.userLevelCompletion.findMany({
      where: { userId, quizLevelId: { in: allLevels.map((l) => l.id) } },
      select: { quizLevelId: true },
    });
    const completedIds = new Set(completions.map((c) => c.quizLevelId));

    const nextLevel = allLevels.find((l) => !completedIds.has(l.id));

    if (nextLevel) {
      return NextResponse.json({
        success: true,
        done: false,
        nextLevelUuid: nextLevel.uuid,
        nextLevelOrder: nextLevel.levelOrder,
      });
    }

    // All levels completed - return final score instead
    const correctCount = await prisma.userProgress.count({
      where: { userId, isCorrect: true },
    });

    return NextResponse.json({
      success: true,
      done: true,
      score: correctCount,
      totalQuestions: allLevels.length,
    });
  } catch (error) {
    console.error('Error fetching next quiz level:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}