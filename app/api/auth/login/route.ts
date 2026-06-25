import { NextResponse } from "next/server";
import { createToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validateLoginServer, normalizeIndexNumber } from "@/lib/validation";
import { applyUserSessionCookie } from "@/lib/authSession";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validationErrors = validateLoginServer(body);
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

    const { indexNumber, password } = body;
    const normalizedIndexNumber = normalizeIndexNumber(indexNumber);

    const user = await prisma.user.findUnique({
      where: {
        indexNumber: normalizedIndexNumber,
      },
    });

    if (!user || user.role !== "USER") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    const token = await createToken({
      id: user.id,
      indexNumber: user.indexNumber ?? "",
      name: user.name,
      role: "USER",
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          indexNumber: user.indexNumber ?? "",
          name: user.name,
        },
      },
      { status: 200 }
    );

    return applyUserSessionCookie(response, token);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Login error:", errorMessage, error);

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
