import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  await prisma.userProgress.deleteMany({});
  await prisma.quizQuestion.deleteMany({});
  await prisma.user.deleteMany({});

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      name: 'System Administrator',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const userPasswordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      indexNumber: '230317J',
      name: 'Sample Player',
      passwordHash: userPasswordHash,
    },
  });

  const question = await prisma.quizQuestion.create({
    data: {
      questionText: 'Sample question',
      answerKey: 'answer',
      questionOrder: 1,
    },
  });

  await prisma.userProgress.create({
    data: {
      userId: user.id,
      questionId: question.id,
      passedAt: new Date(),
      isCorrect: true,
    },
  });

  console.log('Seed completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
