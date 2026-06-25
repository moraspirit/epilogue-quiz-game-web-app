import { NextResponse } from "next/server";
import { createToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validateRegisterServer, normalizeIndexNumber } from "@/lib/validation";
import { applyUserSessionCookie } from "@/lib/authSession";

export async function POST(req: Request) {
  try {
    const body = await req.json();

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
    const normalizedIndexNumber = normalizeIndexNumber(indexNumber);

    const existingUser = await prisma.user.findUnique({
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        indexNumber: normalizedIndexNumber,
        name,
        passwordHash: hashedPassword,
      },
    });

    const token = await createToken({
      id: newUser.id,
      indexNumber: newUser.indexNumber ?? "",
      name: newUser.name,
      role: "USER",
    });

    const response = NextResponse.json(
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

    return applyUserSessionCookie(response, token);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Register error:", errorMessage, error);

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
