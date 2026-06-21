'use server';

// import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// const prisma = new PrismaClient();


export async function addQuestion(formData: FormData) {
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

  revalidatePath('/admin');
}

export async function deleteQuestion(formData: FormData) {
  const questionId = Number(formData.get('questionId'));

  if (!questionId) {
    throw new Error('Question ID is required for deletion.');
  }

  await prisma.quizQuestion.delete({
    where: { id: questionId },
  });

  revalidatePath('/admin');
}