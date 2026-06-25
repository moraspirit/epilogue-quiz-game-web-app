'use server';

// import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import {
  invalidateActiveLevelsCache,
  invalidateLeaderboardCache,
} from '@/lib/cache';
import { invalidateQuizStructureCache } from '@/lib/quizStructure';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) {
    throw new Error('Unauthorized: No admin session found');
  }

  try {
    const payload = await verifyToken(token);
    if (payload.role !== 'admin') {
      throw new Error('Forbidden: Not an administrator');
    }
  } catch (error) {
    throw new Error('Unauthorized: Invalid session token');
  }
}

export async function addQuestion(formData: FormData) {
  await checkAdminAuth();

  const quizLevelId = Number(formData.get('quizLevelId'));
  const questionText = formData.get('questionText') as string;
  const answerKey = formData.get('answerKey') as string;
  const questionOrder = Number(formData.get('questionOrder'));

  if (!quizLevelId || !questionText || !answerKey || isNaN(questionOrder)) {
    throw new Error('All fields are required.');
  }

  await prisma.quizQuestion.create({
    data: { quizLevelId, questionText, answerKey, questionOrder },
  });

  await invalidateQuizStructureCache();
  await invalidateActiveLevelsCache();
  await invalidateLeaderboardCache();

  revalidatePath('/admin');
}

export async function deleteQuestion(formData: FormData) {
  await checkAdminAuth();

  const questionId = Number(formData.get('questionId'));

  if (!questionId) {
    throw new Error('Question ID is required for deletion.');
  }

  try {
    await prisma.quizQuestion.delete({
      where: { id: questionId },
    });
  } catch (error) {
    console.warn(`Question ID ${questionId} not found or already deleted.`);
  }

  await invalidateQuizStructureCache();
  await invalidateActiveLevelsCache();
  await invalidateLeaderboardCache();

  revalidatePath('/admin');
}

export async function moveQuizLevelOrder(formData: FormData) {
  await checkAdminAuth();

  const quizLevelId = Number(formData.get('quizLevelId'));
  const direction = formData.get('direction');

  if (!quizLevelId || (direction !== 'up' && direction !== 'down')) {
    throw new Error('Invalid quiz level reorder request.');
  }

  const levels = await prisma.quizLevel.findMany({
    orderBy: { levelOrder: 'asc' },
    select: { id: true, levelOrder: true },
  });

  const currentIndex = levels.findIndex((level) => level.id === quizLevelId);
  if (currentIndex === -1) {
    throw new Error('Quiz level not found.');
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= levels.length) {
    return;
  }

  const currentLevel = levels[currentIndex];
  const targetLevel = levels[targetIndex];

  await prisma.$transaction([
    prisma.quizLevel.update({
      where: { id: currentLevel.id },
      data: { levelOrder: targetLevel.levelOrder },
    }),
    prisma.quizLevel.update({
      where: { id: targetLevel.id },
      data: { levelOrder: currentLevel.levelOrder },
    }),
  ]);

  await invalidateQuizStructureCache();
  await invalidateActiveLevelsCache();
  await invalidateLeaderboardCache();

  revalidatePath('/admin');
}