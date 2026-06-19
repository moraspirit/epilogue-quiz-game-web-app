import { NextResponse } from "next/server";
import { createToken } from "@/lib/jwt";
import { users } from "@/lib/mockUsers";
import bcrypt from "bcryptjs";
import { validateLoginServer } from "@/lib/validation";

export async function POST(
  req: Request
) {
  try {
    const body = await req.json();

    // Validate input using server-side validation
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

    // Find user by index number
    const user = users.find(
      (u) => u.indexNumber === indexNumber
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createToken({
      id: user.id,
      indexNumber: user.indexNumber,
      name: user.name,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          indexNumber: user.indexNumber,
          name: user.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}