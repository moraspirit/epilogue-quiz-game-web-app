import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  // Prevent seeding in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, message: "Seeding is disabled in production" },
      { status: 403 }
    );
  }

  try {
    // Check if test users already exist
    const existingUsers = await prisma.user.count();

    if (existingUsers > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Database already has users. Seed data not added.",
        },
        { status: 400 }
      );
    }

    // Create test users
    const testUsers = [
      { indexNumber: "CS2024001", name: "Alice Johnson" },
      { indexNumber: "CS2024002", name: "Bob Smith" },
      { indexNumber: "CS2024003", name: "Carol Davis" },
      { indexNumber: "CS2024004", name: "David Wilson" },
      { indexNumber: "CS2024005", name: "Emma Brown" },
    ];

    const hashedPassword = await bcrypt.hash("password123", 10);
    const adminHashedPassword = await bcrypt.hash("admin123", 10);

    // Create system administrator
    await prisma.user.create({
      data: {
        username: "admin",
        name: "System Administrator",
        passwordHash: adminHashedPassword,
        role: "ADMIN",
      },
    });

    const createdUsers = await Promise.all(
      testUsers.map((user) =>
        prisma.user.create({
          data: {
            indexNumber: user.indexNumber,
            name: user.name,
            passwordHash: hashedPassword,
          },
        })
      )
    );

    // Create test progress records
    const levels = await prisma.quizLevel.findMany();
    const questions = await prisma.quizQuestion.findMany({
      take: 5,
    });

    if (questions.length > 0 && levels.length > 0) {
      const progressData = [
        { userId: createdUsers[0].id, score: 450, level: 5 },
        { userId: createdUsers[1].id, score: 380, level: 4 },
        { userId: createdUsers[2].id, score: 320, level: 3 },
        { userId: createdUsers[3].id, score: 200, level: 2 },
        { userId: createdUsers[4].id, score: 150, level: 1 },
      ];

      for (const progress of progressData) {
        const question = questions[0];
        await prisma.userProgress.create({
          data: {
            userId: progress.userId,
            questionId: question.id,
            passedAt: new Date(),
            currentLevel: progress.level,
            totalScore: progress.score,
            status:
              progress.level === 5 ? "Completed" : "Playing",
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Test data seeded successfully",
        data: {
          usersCreated: createdUsers.length,
          users: createdUsers.map((u) => ({
            id: u.id,
            name: u.name,
            indexNumber: u.indexNumber ?? "",
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Seed error:", errorMessage, error);

    if (
      errorMessage.includes("connect") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Database connection failed. Please ensure your database is running.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
