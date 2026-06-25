'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import {
  invalidateActiveLevelsCache,
  invalidateLeaderboardCache,
} from '@/lib/cache';
import { parseQuestionAnswerFromForm } from '@/lib/answerPattern';
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
  } catch {
    throw new Error('Unauthorized: Invalid session token');
  }
}

async function applyQuestionOrder(ids: number[]) {
  if (ids.length === 0) {
    return;
  }

  // Use temporary order values first so unique questionOrder never collides mid-update.
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.quizQuestion.update({
        where: { id },
        data: { questionOrder: 100000 + index },
      })
    )
  );

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.quizQuestion.update({
        where: { id },
        data: { questionOrder: index + 1 },
      })
    )
  );
}

async function renormalizeQuestionOrders() {
  const questions = await prisma.quizQuestion.findMany({
    orderBy: { questionOrder: 'asc' },
    select: { id: true },
  });

  await applyQuestionOrder(questions.map((question) => question.id));
}

async function invalidateQuizCaches() {
  await invalidateQuizStructureCache();
  await invalidateActiveLevelsCache();
  await invalidateLeaderboardCache();
}

export async function addQuestion(formData: FormData) {
  await checkAdminAuth();

  const questionText = formData.get('questionText') as string;

  if (!questionText?.trim()) {
    throw new Error('Question text is required.');
  }

  const { answerKey, answerPattern } = parseQuestionAnswerFromForm(formData);

  const maxOrder = await prisma.quizQuestion.aggregate({
    _max: { questionOrder: true },
  });
  const questionOrder = (maxOrder._max.questionOrder ?? 0) + 1;

  await prisma.quizQuestion.create({
    data: {
      questionText,
      answerKey,
      questionOrder,
      answerPattern,
    },
  });

  await invalidateQuizCaches();
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
  } catch {
    console.warn(`Question ID ${questionId} not found or already deleted.`);
  }

  await renormalizeQuestionOrders();
  await invalidateQuizCaches();
  revalidatePath('/admin');
}

export async function moveQuestionOrder(formData: FormData) {
  await checkAdminAuth();

  const questionId = Number(formData.get('questionId'));
  const direction = formData.get('direction');

  if (!questionId || (direction !== 'up' && direction !== 'down')) {
    throw new Error('Invalid question reorder request.');
  }

  const questions = await prisma.quizQuestion.findMany({
    orderBy: { questionOrder: 'asc' },
    select: { id: true, questionOrder: true },
  });

  const currentIndex = questions.findIndex(
    (question) => question.id === questionId
  );
  if (currentIndex === -1) {
    throw new Error('Question not found.');
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= questions.length) {
    return;
  }

  const orderedIds = questions.map((question) => question.id);
  [orderedIds[currentIndex], orderedIds[targetIndex]] = [
    orderedIds[targetIndex],
    orderedIds[currentIndex],
  ];

  await applyQuestionOrder(orderedIds);
  await invalidateQuizCaches();
  revalidatePath('/admin');
}
