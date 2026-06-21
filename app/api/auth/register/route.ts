import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validateRegisterServer } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input using server-side validation
    const validationErrors = validateRegisterServer(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    const { indexNumber, name, password } = body;
    const normalizedIndexNumber = indexNumber.toUpperCase();

    // Check if user already exists
    const existingUser =
  await prisma.user.findUnique({
    where: {
      indexNumber: normalizedIndexNumber,
    },
  });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Index number already registered",
          errors: [
            {
              field: "indexNumber",
              message: "This index number is already in use",
            },
          ],
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create new user (in production, this would be saved to database)
    const newUser =
      await prisma.user.create({
        data: {
          indexNumber: normalizedIndexNumber,
          name,
          passwordHash: hashedPassword,
        },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user: {
          id: newUser.id,
          indexNumber: newUser.indexNumber ?? "",
          name: newUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Register error:", errorMessage, error);
    
    // Check if it's a database connection error
    if (errorMessage.includes("connect") || errorMessage.includes("ECONNREFUSED")) {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed. Please ensure your database is running.",
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