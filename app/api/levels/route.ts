import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';

export async function GET(req: NextRequest) {
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

    // Fetch all active quiz levels ordered by level order
    const levels = await prisma.quizLevel.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        levelOrder: 'asc',
      },
      select: {
        id: true,
        uuid: true,
        title: true,
        levelOrder: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      levels,
    });
  } catch (error) {
    console.error('Error fetching levels:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
