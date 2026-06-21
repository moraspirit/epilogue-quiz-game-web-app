import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  await prisma.winner.deleteMany({});
  await prisma.userLevelCompletion.deleteMany({});
  await prisma.userProgress.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.quizQuestion.deleteMany({});
  await prisma.quizLevel.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.preRegisteredIndex.deleteMany({});

  console.log('📋 Adding pre-registered indices...');
  const indices = await prisma.preRegisteredIndex.createMany({
    data: [
      { indexNumber: 'INDEX001' },
      { indexNumber: 'INDEX002' },
      { indexNumber: 'INDEX003' },
      { indexNumber: 'INDEX004' },
      { indexNumber: 'INDEX005' },
    ],
  });
  console.log(`✅ Created ${indices.count} pre-registered indices`);

  console.log('👑 Adding admin user...');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      name: 'System Administrator',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user');

  console.log('👥 Adding users...');
  const user1 = await prisma.user.create({
    data: {
      indexNumber: 'INDEX001',
      name: 'Ahmed Hassan',
      passwordHash: '$2a$12$fake.hash.1', // Mock hash
      createdAt: new Date('2024-01-01'),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      indexNumber: 'INDEX002',
      name: 'Fatima Al-Rashid',
      passwordHash: '$2a$12$fake.hash.2',
      createdAt: new Date('2024-01-02'),
    },
  });

  const user3 = await prisma.user.create({
    data: {
      indexNumber: 'INDEX003',
      name: 'Mohammed Ali',
      passwordHash: '$2a$12$fake.hash.3',
      createdAt: new Date('2024-01-03'),
    },
  });
  console.log('✅ Created 3 users');

  console.log('📝 Adding password resets...');
  await prisma.passwordReset.create({
    data: {
      userId: user1.id,
      requestedAt: new Date('2024-01-15'),
      availableAt: new Date('2024-01-16'),
      usedAt: null,
    },
  });
  console.log('✅ Created 1 password reset request');

  console.log('🎮 Adding quiz levels...');
  const level1 = await prisma.quizLevel.create({
    data: {
      uuid: randomUUID(),
      title: 'Level 1: General Knowledge',
      levelOrder: 1,
      isActive: true,
    },
  });

  const level2 = await prisma.quizLevel.create({
    data: {
      uuid: randomUUID(),
      title: 'Level 2: Advanced Topics',
      levelOrder: 2,
      isActive: true,
    },
  });

  const level3 = await prisma.quizLevel.create({
    data: {
      uuid: randomUUID(),
      title: 'Level 3: Expert Challenge',
      levelOrder: 3,
      isActive: true,
    },
  });
  console.log('✅ Created 3 quiz levels');

  console.log('❓ Adding quiz questions...');
  // Level 1 Questions
  const q1_1 = await prisma.quizQuestion.create({
    data: {
      quizLevelId: level1.id,
      questionText: 'What is the capital of Egypt?',
      answerKey: 'Cairo',
      questionOrder: 1,
    },
  });

  const q1_2 = await prisma.quizQuestion.create({
    data: {
      quizLevelId: level1.id,
      questionText: 'What is 5 + 7?',
      answerKey: '12',
      questionOrder: 2,
    },
  });

  const q1_3 = await prisma.quizQuestion.create({
    data: {
      quizLevelId: level1.id,
      questionText: 'Who wrote Romeo and Juliet?',
      answerKey: 'William Shakespeare',
      questionOrder: 3,
    },
  });

  // Level 2 Questions
  const q2_1 = await prisma.quizQuestion.create({
    data: {
      quizLevelId: level2.id,
      questionText: 'What is the chemical symbol for Gold?',
      answerKey: 'Au',
      questionOrder: 1,
    },
  });

  const q2_2 = await prisma.quizQuestion.create({
    data: {
      quizLevelId: level2.id,
      questionText: 'In what year did World War II end?',
      answerKey: '1945',
      questionOrder: 2,
    },
  });

  // Level 3 Questions
  const q3_1 = await prisma.quizQuestion.create({
    data: {
      quizLevelId: level3.id,
      questionText: 'What is the smallest prime number?',
      answerKey: '2',
      questionOrder: 1,
    },
  });

  console.log('✅ Created 6 quiz questions');

  console.log('📊 Adding user progress...');
  // User 1 completed Level 1 (answered all 3 questions correctly)
  await prisma.userProgress.createMany({
    data: [
      { userId: user1.id, questionId: q1_1.id, passedAt: new Date('2024-01-10T10:00:00'), isCorrect: true },
      { userId: user1.id, questionId: q1_2.id, passedAt: new Date('2024-01-10T10:05:00'), isCorrect: true },
      { userId: user1.id, questionId: q1_3.id, passedAt: new Date('2024-01-10T10:10:00'), isCorrect: true },
      // User 1 answered 2 questions in Level 2
      { userId: user1.id, questionId: q2_1.id, passedAt: new Date('2024-01-10T10:30:00'), isCorrect: true },
      { userId: user1.id, questionId: q2_2.id, passedAt: new Date('2024-01-10T10:35:00'), isCorrect: true },
      // User 2 completed Level 1
      { userId: user2.id, questionId: q1_1.id, passedAt: new Date('2024-01-12T14:00:00'), isCorrect: true },
      { userId: user2.id, questionId: q1_2.id, passedAt: new Date('2024-01-12T14:05:00'), isCorrect: true },
      { userId: user2.id, questionId: q1_3.id, passedAt: new Date('2024-01-12T14:10:00'), isCorrect: true },
    ],
  });
  console.log('✅ Created user progress records');

  console.log('🏆 Adding level completions...');
  // User 1 completed Level 1
  await prisma.userLevelCompletion.create({
    data: {
      userId: user1.id,
      quizLevelId: level1.id,
      completedAt: new Date('2024-01-10T10:15:00'),
    },
  });

  // User 2 completed Level 1
  await prisma.userLevelCompletion.create({
    data: {
      userId: user2.id,
      quizLevelId: level1.id,
      completedAt: new Date('2024-01-12T14:15:00'),
    },
  });

  // User 1 completed Level 2
  await prisma.userLevelCompletion.create({
    data: {
      userId: user1.id,
      quizLevelId: level2.id,
      completedAt: new Date('2024-01-10T10:40:00'),
    },
  });

  // User 1 completed Level 3 (winner!)
  await prisma.userLevelCompletion.create({
    data: {
      userId: user1.id,
      quizLevelId: level3.id,
      completedAt: new Date('2024-01-10T11:00:00'),
    },
  });

  console.log('✅ Created level completion records');

  console.log('🥇 Adding winners...');
  // User 1 is the first winner
  const winner1 = await prisma.winner.create({
    data: {
      userId: user1.id,
      finishedAt: new Date('2024-01-10T11:05:00'),
      rank: 1,
    },
  });

  // User 3 is the second winner (complete all levels later)
  await prisma.userProgress.createMany({
    data: [
      { userId: user3.id, questionId: q1_1.id, passedAt: new Date('2024-01-11T09:00:00'), isCorrect: true },
      { userId: user3.id, questionId: q1_2.id, passedAt: new Date('2024-01-11T09:05:00'), isCorrect: true },
      { userId: user3.id, questionId: q1_3.id, passedAt: new Date('2024-01-11T09:10:00'), isCorrect: true },
      { userId: user3.id, questionId: q2_1.id, passedAt: new Date('2024-01-11T09:30:00'), isCorrect: true },
      { userId: user3.id, questionId: q2_2.id, passedAt: new Date('2024-01-11T09:35:00'), isCorrect: true },
      { userId: user3.id, questionId: q3_1.id, passedAt: new Date('2024-01-11T10:00:00'), isCorrect: true },
    ],
  });

  await prisma.userLevelCompletion.createMany({
    data: [
      { userId: user3.id, quizLevelId: level1.id, completedAt: new Date('2024-01-11T09:15:00') },
      { userId: user3.id, quizLevelId: level2.id, completedAt: new Date('2024-01-11T09:40:00') },
      { userId: user3.id, quizLevelId: level3.id, completedAt: new Date('2024-01-11T10:05:00') },
    ],
  });

  const winner2 = await prisma.winner.create({
    data: {
      userId: user3.id,
      finishedAt: new Date('2024-01-11T10:10:00'),
      rank: 2,
    },
  });

  console.log('✅ Created 2 winner records');

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Pre-registered indices: 5`);
  console.log(`   - Users: 3`);
  console.log(`   - Quiz Levels: 3`);
  console.log(`   - Questions: 6`);
  console.log(`   - Winners: 2`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
